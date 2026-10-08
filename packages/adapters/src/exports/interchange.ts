import JSZip from 'jszip';
import { parseProject, type Project } from '@planner/domain/model';
import { createDrawing, parseDrawing, type Drawing } from '@planner/domain/drawings/model';
import { drawingSvg, drawingDrawio } from './drawings';
import { estimate } from '@planner/domain/pricing';
import { serviceFor, type Provider } from '@planner/domain/providers';
import { layoutProject } from '@planner/domain/diagram/layout';
import { escapeXml } from './xml';
export type DocumentData = { project: Project } | { drawing: Drawing };
const encode = (s:string) => btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
const decode = (s:string) => new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)));
export function validateDocument(value:unknown):DocumentData {
 if(typeof value!=='object'||value===null)throw new Error('Invalid diagram document');
 if('project' in value)return {project:parseProject(value.project)};
 if('drawing' in value)return {drawing:parseDrawing(value.drawing)};
 throw new Error('Missing project or drawing');
}
const fingerprint=(text:string)=>{const s=text.replace(/\r\n/g,'\n').trimEnd();let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16);};
function xml(text:string){if(/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('XML declarations with external entities are not supported');const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Invalid XML');return doc;}
function label(s:string){return s.replace(/[\r\n]/g,' ').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function mermaidExport(data:DocumentData):string {
 const doc=validateDocument(data),nodes='project' in doc?doc.project.variants.find(v=>v.id===doc.project.activeVariantId)!.resources:doc.drawing.nodes;
 const edges='project' in doc?doc.project.variants.find(v=>v.id===doc.project.activeVariantId)!.connections:doc.drawing.edges;
 const ids=new Map(nodes.map((n,i)=>[n.id,`n${i}`]));
 const body='drawing' in doc && doc.drawing.kind==='sequence'
  ? ['sequenceDiagram',...nodes.map(n=>`  participant ${ids.get(n.id)} as ${label('name' in n?n.name:n.label)}`),...doc.drawing.edges.map(e=>`  ${ids.get(e.source)}${e.reply?'-->>':'->>'}${ids.get(e.target)}: ${label(e.label)}`)].join('\n')
  : 'drawing' in doc && doc.drawing.kind==='er'
  ? ['erDiagram',...doc.drawing.nodes.map(n=>`  ${ids.get(n.id)}["${label(n.label)}"] {\n${n.fields.map((f,i)=>`    string field${i} "${label(f)}"`).join('\n')}\n  }`),...doc.drawing.edges.map(e=>`  ${ids.get(e.source)} ${e.relation==='1:1'?'||--||':e.relation==='N:M'?'}o--o{':'||--o{'} ${ids.get(e.target)} : "${label(e.label)}"`)].join('\n')
  : ['flowchart LR',...nodes.map(n=>`  ${ids.get(n.id)}["${label('name' in n?n.name:n.label)}"]`),...edges.map(e=>`  ${ids.get(e.source)} -->|"${label(e.label)}"| ${ids.get(e.target)}`)].join('\n');
 return `%% planner-document ${fingerprint(body)} ${encode(JSON.stringify(doc))}\n${body}`;
}
export async function xmlExport(data:DocumentData):Promise<string>{
 const doc=validateDocument(data);const body='project' in doc?(await import('./artifacts')).drawioXml(await layoutProject(doc.project)):drawingDrawio(doc.drawing);
 return body.replace('<mxfile',`<mxfile plannerDocument="${encode(JSON.stringify(doc))}" plannerFingerprint="${fingerprint(body)}"`);
}
export function textImport(text:string,format:'mmd'|'xml',projectId:string):DocumentData {
 if(text.length>10_000_000)throw new Error('Diagram file exceeds 10 MB');
 if(format==='mmd'){
  const match=text.match(/^%% planner-document ([a-f0-9]+) ([A-Za-z0-9+/=]+)\r?\n/);
  if(match&&fingerprint(text.slice(match[0].length))===match[1])return validateDocument(JSON.parse(decode(match[2])));
  return {drawing:parseMermaid(text,projectId)};
 }
 const doc=xml(text),root=doc.documentElement,embedded=root.getAttribute('plannerDocument');
 const plain=text.replace(/ plannerDocument="[^"]*"/,'').replace(/ plannerFingerprint="[^"]*"/,'');
 if(embedded&&root.getAttribute('plannerFingerprint')===fingerprint(plain))return validateDocument(JSON.parse(decode(embedded)));
 const cells=[...doc.querySelectorAll('mxCell')];const cellIds=cells.map(c=>c.getAttribute('id'));if(cellIds.some(id=>!id)||new Set(cellIds).size!==cells.length)throw new Error('Draw.io cells require unique IDs');if(cells.length>10000)throw new Error('Too many XML diagram cells');if(!cells.length)throw new Error('Expected uncompressed Draw.io XML with mxCell elements');
 const drawing=createDrawing(projectId,'flowchart'),ids=new Map<string,string>();
 const position=(cell:Element,seen=new Set<string>()):{x:number;y:number}=>{const id=cell.getAttribute('id')??'';if(seen.has(id))throw new Error('Cyclic XML groups');seen.add(id);const g=cell.querySelector('mxGeometry'),parent=cells.find(c=>c.getAttribute('id')===cell.getAttribute('parent')&&c.getAttribute('vertex')==='1');const p=parent?position(parent,seen):{x:0,y:0};return {x:p.x+Number(g?.getAttribute('x')??0),y:p.y+Number(g?.getAttribute('y')??0)};};
 for(const cell of cells.filter(c=>c.getAttribute('vertex')==='1')){const id=crypto.randomUUID();ids.set(cell.getAttribute('id')??'',id);const style=cell.getAttribute('style')??'';drawing.nodes.push({id,label:cell.getAttribute('value')||'Shape',shape:style.includes('rhombus')?'decision':'process',fields:[],...position(cell)});}
 for(const cell of cells.filter(c=>c.getAttribute('edge')==='1')){const source=ids.get(cell.getAttribute('source')??''),target=ids.get(cell.getAttribute('target')??'');if(!source||!target)throw new Error('XML connector references unsupported or missing endpoints');drawing.edges.push({id:crypto.randomUUID(),source,target,label:cell.getAttribute('value')??''});}
 return {drawing:parseDrawing(drawing)};
}
export function parseMermaid(text:string,projectId:string):Drawing {
 if(/^\s*sequenceDiagram/m.test(text)){
  const d=createDrawing(projectId,'sequence'),ids=new Map<string,string>();
  const participant=(key:string,name=key)=>{let id=ids.get(key);if(!id){id=crypto.randomUUID();ids.set(key,id);d.nodes.push({id,label:name,shape:'participant',fields:[],x:0,y:0});}return id;};
  for(const line of text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('%%')&&l!=='sequenceDiagram')){
   const p=/^participant ([\w-]+)(?: as (.+))?$/.exec(line);if(p){participant(p[1],p[2]??p[1]);continue;}
   const e=/^([\w-]+?)(-->>|->>)([\w-]+):\s*(.*)$/.exec(line);if(e){d.edges.push({id:crypto.randomUUID(),source:participant(e[1]),target:participant(e[3]),label:e[4],reply:e[2]==='-->>'});continue;}
   throw new Error(`Unsupported Mermaid sequence syntax: ${line.slice(0,80)}`);
  }
  if(!d.nodes.length)throw new Error('Sequence diagram has no participants');return parseDrawing(d);
 }

 if(/^\s*erDiagram/m.test(text)){
  const d=createDrawing(projectId,'er'),ids=new Map<string,string>();let current:string|undefined;
  const entity=(key:string,name=key)=>{let id=ids.get(key);if(!id){id=crypto.randomUUID();ids.set(key,id);d.nodes.push({id,label:name,shape:'entity',fields:[],x:40+(ids.size-1)%3*240,y:60+Math.floor((ids.size-1)/3)*180});}return id;};
  for(const line of text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('%%')&&l!=='erDiagram')){
   if(current){if(line==='}'){current=undefined;continue;}if(!/^[\w]+\s+[\w]+(?:\s+.*)?$/.test(line))throw new Error('Unsupported ER attribute syntax');d.nodes.find(n=>n.id===current)!.fields.push(line);continue;}
   const n=/^([\w-]+)(?:\["([^"\]]+)"\])?\s*\{$/.exec(line);if(n){current=entity(n[1],n[2]??n[1]);continue;}
   const e=/^([\w-]+)\s+([|o}{]+)(?:--|\.\.)([|o}{]+)\s+([\w-]+)\s*:\s*"?(.*?)"?$/.exec(line);if(e){const a=e[2].includes('}'),b=e[3].includes('{');d.edges.push({id:crypto.randomUUID(),source:entity(e[1]),target:entity(e[4]),label:e[5],relation:a&&b?'N:M':a||b?'1:N':'1:1'});continue;}
   throw new Error(`Unsupported Mermaid ER syntax: ${line.slice(0,80)}`);
  }
  if(current||!d.nodes.length)throw new Error('Incomplete ER diagram');return parseDrawing(d);
 }
 const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('%%'));
 if(!/^(flowchart|graph)\s+(LR|RL|TB|TD|BT)\s*;?$/.test(lines.shift()??''))throw new Error('Plain Mermaid import supports flowchart/graph diagrams. Exported planner Mermaid files preserve other diagram types.');
 const drawing=createDrawing(projectId,'flowchart'),ids=new Map<string,string>();
 const node=(key:string,name=key,shape:'process'|'decision'='process')=>{let id=ids.get(key);if(!id){id=crypto.randomUUID();ids.set(key,id);drawing.nodes.push({id,label:name,shape,fields:[],x:40+(ids.size-1)%3*240,y:60+Math.floor((ids.size-1)/3)*140});}else if(name!==key){const n=drawing.nodes.find(n=>n.id===id)!;n.label=name;n.shape=shape;}return id;};
 const unescape=(s:string)=>s.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 for(const [index,line] of lines.entries()){
  const declaration=/^([\w-]+)\s*(?:\["?([^\]]*?)"?\]|\{"?([^}]*?)"?\})\s*;?$/.exec(line);
  if(declaration){node(declaration[1],unescape(declaration[2]??declaration[3]),declaration[3]!==undefined?'decision':'process');continue;}
  const edge=/^([\w-]+)(?:\["?([^\]]*?)"?\])?\s*-->\s*(?:\|"?([^|]*?)"?\|\s*)?([\w-]+)(?:\["?([^\]]*?)"?\])?\s*;?$/.exec(line);
  if(edge){drawing.edges.push({id:crypto.randomUUID(),source:node(edge[1],unescape(edge[2]??edge[1])),target:node(edge[4],unescape(edge[5]??edge[4])),label:unescape(edge[3]??'')});continue;}
  throw new Error(`Unsupported Mermaid syntax at line ${index+2}: ${line.slice(0,80)}`);
 }
 if(!drawing.nodes.length)throw new Error('Mermaid diagram has no nodes');return parseDrawing(drawing);
}
// OOXML uses inline strings: no macros, formulas, or external references are generated/executed.
const sheet=(rows:string[][])=>`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="2" width="42" customWidth="1"/><col min="3" max="7" width="22" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((v,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
export async function excelExport(data:DocumentData):Promise<Blob>{
 const doc=validateDocument(data),zip=new JSZip(),json=encode(JSON.stringify(doc)),chunks=json.match(/[\s\S]{1,30000}/g)??[];
 const records='project' in doc?doc.project.variants.find(v=>v.id===doc.project.activeVariantId)!.resources:doc.drawing.nodes;
 const rows='project' in doc ? [['ID','Label','Provider','Region','Service','Environment','SKU'],...doc.project.variants.find(v=>v.id===doc.project.activeVariantId)!.resources.map(n=>[n.id,n.name,n.provider,n.region,n.service,n.environment,n.configuration.sku])] : [['ID','Label'],...records.map(n=>[n.id,'name' in n?n.name:n.label])];
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Diagram" sheetId="1" r:id="r1"/><sheet name="Planner data" sheetId="2" r:id="r2"/><sheet name="Overview" sheetId="3" r:id="r3"/></sheets></workbook>');
 zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="r2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="r3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>');
 const overview:string[][]=[['Architecture planner export'],['Edit the Diagram table; keep ID and Planner data unchanged.'],['Image/diagram documents remain separate from project architecture.']];
 if('project' in doc){overview.push(['Project',doc.project.name],['Cost calculations',doc.project.costEnabled?'Enabled':'Disabled']);if(doc.project.costEnabled){const cost=estimate(doc.project);overview.push(['Known monthly subtotal USD',String(cost.base)],['Complete',String(cost.complete)],['Resource','Known USD subtotal','Priced'],...cost.resources.map(r=>[r.name,String(r.base),String(r.complete)]),['Warnings'],...cost.warnings.map(w=>[w]),['Pricing sources'],...cost.sources.map(url=>[url]));}}
 zip.file('xl/worksheets/sheet3.xml',sheet(overview));
 zip.file('xl/worksheets/sheet1.xml',sheet(rows));zip.file('xl/worksheets/sheet2.xml',sheet([['Planner document v1'],...chunks.map(c=>[c])]));
 return new Blob([await zip.generateAsync({type:'arraybuffer'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
/** Bound central-directory sizes before decompressing untrusted workbook parts. */
export function validateWorkbookArchive(bytes:ArrayBuffer):void {
 const view=new DataView(bytes);let end=-1;
 for(let offset=bytes.byteLength-22;offset>=Math.max(0,bytes.byteLength-65557);offset--){if(view.getUint32(offset,true)===0x06054b50){end=offset;break;}}
 if(end<0)throw new Error('Invalid XLSX ZIP archive');
 const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true),size=view.getUint32(end+12,true);
 if(count>100||view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0||start+size>end)throw new Error('Unsupported or oversized workbook archive');
 let offset=start,total=0;
 for(let i=0;i<count;i++){
  if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)throw new Error('Invalid workbook directory');
  const expanded=view.getUint32(offset+24,true);total+=expanded;
  if(expanded>15_000_000||total>30_000_000||view.getUint16(offset+8,true)&1)throw new Error('Workbook expanded size or encryption is unsupported');
  offset+=46+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
 }
 if(offset!==start+size)throw new Error('Invalid workbook directory size');
}
export async function excelImport(bytes:ArrayBuffer):Promise<DocumentData>{
 if(bytes.byteLength>10_000_000)throw new Error('Excel file exceeds 10 MB');validateWorkbookArchive(bytes);const zip=await JSZip.loadAsync(bytes);if(Object.keys(zip.files).length>100)throw new Error('Workbook contains too many parts');
 const read=async(path:string)=>{const file=zip.file(path);if(!file)throw new Error('Use an XLSX workbook exported by this app');const text=await file.async('string');if(text.length>15_000_000)throw new Error('Workbook part exceeds limit');return xml(text);};
 const sharedFile=zip.file('xl/sharedStrings.xml'),shared=sharedFile?[...(await read('xl/sharedStrings.xml')).querySelectorAll('si')].map(s=>s.textContent??''):[];
 const rows=(doc:Document)=>[...doc.querySelectorAll('sheetData row')].map(r=>[...r.querySelectorAll('c')].map(c=>{if(c.querySelector('f'))throw new Error('Formula cells are not supported for diagram data');return c.getAttribute('t')==='s'?shared[Number(c.querySelector('v')?.textContent)]??'':c.getAttribute('t')==='inlineStr'?c.querySelector('is')?.textContent??'':c.querySelector('v')?.textContent??'';}));
 const payload=rows(await read('xl/worksheets/sheet2.xml'));if(payload.shift()?.[0]!=='Planner document v1')throw new Error('Missing Planner data sheet');
 const data=validateDocument(JSON.parse(decode(payload.map(r=>r[0]).join('')))),table=rows(await read('xl/worksheets/sheet1.xml'));
 const columns='project' in data?['ID','Label','Provider','Region','Service','Environment','SKU']:['ID','Label'];
 if(table.shift()?.join(',')!==columns.join(','))throw new Error('Diagram sheet requires ID and Label columns');
 const nodes='project' in data?data.project.variants.find(v=>v.id===data.project.activeVariantId)!.resources:data.drawing.nodes;
 const seen=new Set<string>();for(const row of table){if(row.length!==columns.length||seen.has(row[0]))throw new Error('Invalid or duplicate diagram row');seen.add(row[0]);const n=nodes.find(n=>n.id===row[0]);if(!n)throw new Error('Unknown diagram ID; use the app to create or delete nodes');if('name' in n){n.name=row[1];n.provider=row[2] as Provider;n.region=row[3];n.service=row[4];n.environment=row[5];n.configuration.sku=row[6];const svc=serviceFor(n.provider,n.service);n.category=svc?.category??'unsupported';n.unsupported=!svc||svc.category==='unsupported';}else n.label=row[1];}
 if(seen.size!==nodes.length)throw new Error('Missing diagram rows; use the app to delete nodes');return validateDocument(data);
}
export async function rasterExport(data:DocumentData,type:'png'|'jpeg'):Promise<Blob>{const doc=validateDocument(data);const svg='project' in doc?(await import('./artifacts')).graphSvg(await layoutProject(doc.project)):drawingSvg(doc.drawing);const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Image rendering failed'));img.src=url;});if(img.width*img.height>32_000_000)throw new Error('Diagram is too large for image export');const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export requires canvas');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image export failed')),`image/${type}`,0.92));}finally{URL.revokeObjectURL(url);}}
export async function imageImport(file:File):Promise<{imageData:string;imageWidth:number;imageHeight:number;label:string}>{
 if(file.size>5_000_000)throw new Error('Reference images must be under 5 MB');
 const bytes=new Uint8Array(await file.arrayBuffer()),png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10,jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!png&&!jpeg)throw new Error('Expected a PNG or JPEG image');
 const imageData=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Unable to read image'));r.readAsDataURL(new Blob([bytes],{type:png?'image/png':'image/jpeg'}));});
 const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Invalid image data'));img.src=imageData;});if(img.naturalWidth*img.naturalHeight>32_000_000)throw new Error('Image exceeds 32 megapixels');
 const scale=Math.min(1,640/img.naturalWidth,480/img.naturalHeight);return {imageData,imageWidth:img.naturalWidth*scale,imageHeight:img.naturalHeight*scale,label:file.name||'Reference image'};
}
