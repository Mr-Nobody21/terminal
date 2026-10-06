import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { activeVariant, parseProject, serializeProject, type Project } from '../../core/model';
import { layoutProject, type Graph } from '../diagram/layout';
import { iconData } from '../../data/icons';
import { estimate } from '../pricing';

export const blobBytes = async (blob:Blob):Promise<ArrayBuffer> => typeof blob.arrayBuffer==='function'?blob.arrayBuffer():new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(blob);});
export type ExportFormat = 'json'|'drawio'|'svg'|'png'|'pdf'|'md'|'docx'|'zip';
export const escapeXml = (text:string) => text.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const md = (text:string) => text.replace(/[\\`*_{}[\]<>|#]/g,'\\$&').replace(/\r?\n/g,' ');
export function drawioXml(graph:Graph):string {
  const nodes=graph.nodes.map(n=>{const parent=graph.nodes.find(p=>p.id===n.parentId);return `<mxCell id="${escapeXml(n.id)}" value="${escapeXml(n.label)}" style="${n.kind==='boundary'?'swimlane;html=0;startSize=32;fillColor=#f1f5f9;':`shape=image;image=${iconData(n.resource!.provider,n.resource!.service)};verticalLabelPosition=bottom;verticalAlign=top;html=0;imageAspect=1;`}" vertex="1" parent="${escapeXml(n.parentId??'1')}"><mxGeometry x="${n.x-(parent?.x??0)}" y="${n.y-(parent?.y??0)}" width="${n.width}" height="${n.height}" as="geometry"/></mxCell>`;}).join('');
  const edges=graph.edges.map(e=>`<mxCell id="${escapeXml(e.id)}" value="${escapeXml(e.label)}" style="edgeStyle=orthogonalEdgeStyle;html=0;endArrow=block;" edge="1" parent="1" source="${escapeXml(e.source)}" target="${escapeXml(e.target)}"><mxGeometry relative="1" as="geometry"/></mxCell>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net"><diagram name="Architecture"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${nodes}${edges}</root></mxGraphModel></diagram></mxfile>`;
}
export function graphSvg(graph:Graph):string {
  const nodes=graph.nodes.map(n=>`<g id="${escapeXml(n.id)}"><rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="8" fill="${n.kind==='boundary'?'#f1f5f9':'white'}" stroke="#64748b"/><text x="${n.x+12}" y="${n.y+24}" font-family="sans-serif" font-size="13" fill="#0f172a">${escapeXml(n.label)}</text>${n.resource?`<image href="${escapeXml(iconData(n.resource.provider,n.resource.service))}" x="${n.x+12}" y="${n.y+32}" width="36" height="36"/>`:""}</g>`).join('');
  const edges=graph.edges.map(e=>{const a=graph.nodes.find(n=>n.id===e.source)!,b=graph.nodes.find(n=>n.id===e.target)!;const x1=a.x+a.width,y1=a.y+a.height/2,x2=b.x,y2=b.y+b.height/2;return `<g><path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#475569" fill="none" marker-end="url(#arrow)"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-5}" font-family="sans-serif" font-size="11">${escapeXml(e.label)}</text></g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${graph.width}" height="${graph.height}" viewBox="0 0 ${graph.width} ${graph.height}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#475569"/></marker></defs><rect width="100%" height="100%" fill="white"/>${nodes}${edges}</svg>`;
}
export function reportMarkdown(project:Project):string {
  const p=parseProject(project);const lines=[`# ${md(p.name)}`,`Provider: ${p.provider} / ${p.region}`,`Estimate date: ${p.updatedAt.slice(0,10)}`,`Requirements / PRD: ${md(p.requirementsText)}`,'','## Requirements',...p.requirements.map(r=>`- ${md(r.text)} (${r.status}; source: ${md(p.sources.find(s=>s.id===r.sourceId)?.kind??'unknown')})${r.answer?`: ${md(r.answer)}`:''}`),'','## Assumptions',...p.assumptions.map(a=>`- ${md(a.label)}: ${md(a.value)} ${md(a.unit)} (source: ${a.source})`)];
  for(const v of p.variants){const cost=estimate(p,v);lines.push('',`## ${v.name}`,md(v.description),`Known monthly subtotal (USD): low $${cost.low.toFixed(2)} / base $${cost.base.toFixed(2)} / high $${cost.high.toFixed(2)}`,`Estimate complete: ${cost.complete?'yes':'no; unpriced resources are excluded from known subtotal'}`,...v.resources.map(r=>`- ${md(r.name)}: ${md(r.service)} / ${md(r.environment)}`),...cost.resources.flatMap(r=>r.lineItems.map(l=>`- ${md(r.name)} formula: ${md(l.formula)}; SKU: ${md(l.rate.sku)}; units: ${md(l.rate.units)}; catalog retrieved: ${l.rate.retrieved}; inputs: ${md(JSON.stringify(l.inputs))}; rate assumptions: ${md(l.rate.assumptions)}`)),...cost.warnings.map(w=>`- Warning: ${md(w)}`),'Pricing sources:',...cost.sources.map(s=>`- ${md(typeof s==='string'?s:JSON.stringify(s))}`));}
  lines.push('','Taxes, credits, negotiated discounts and free-tier benefits are excluded. Month default: 730 hours. If only a base scenario is supplied, equal bounds do not imply certainty.');return lines.join('\n');
}
async function png(svg:string):Promise<Blob>{
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try {const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Unable to rasterize diagram'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas is unavailable');context.drawImage(img,0,0);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed')),'image/png'));}finally{URL.revokeObjectURL(url);}
}
async function pdf(project:Project,graph:Graph):Promise<Blob>{
  const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);let page=doc.addPage([842,595]);const scale=Math.min(780/graph.width,520/graph.height);for(const n of graph.nodes){page.drawRectangle({x:30+n.x*scale,y:560-(n.y+n.height)*scale,width:n.width*scale,height:n.height*scale,borderWidth:1,borderColor:rgb(.4,.5,.6),color:rgb(.96,.97,.98)});page.drawText(n.label.replace(/[^\x20-\x7e]/g,'?').slice(0,28),{x:35+n.x*scale,y:545-n.y*scale,size:Math.max(5,10*scale),font});}for(const e of graph.edges){const a=graph.nodes.find(n=>n.id===e.source)!,b=graph.nodes.find(n=>n.id===e.target)!;page.drawLine({start:{x:30+(a.x+a.width)*scale,y:560-(a.y+a.height/2)*scale},end:{x:30+b.x*scale,y:560-(b.y+b.height/2)*scale},thickness:1});}
  page=doc.addPage();let y=800;for(const line of reportMarkdown(project).split('\n')){const safe=line.replace(/[^\x20-\x7e]/g,'?');for(let i=0;i<Math.max(1,safe.length);i+=90){if(y<40){page=doc.addPage();y=800;}page.drawText(safe.slice(i,i+90),{x:35,y,size:10,font});y-=15;}}return new Blob([new Uint8Array(await doc.save())],{type:'application/pdf'});
}
export async function exportArtifact(project:Project,format:ExportFormat):Promise<Blob>{
  const p=parseProject(project);
  if(format==='json')return new Blob([serializeProject(p)],{type:'application/json'});
  if(format==='md')return new Blob([reportMarkdown(p)],{type:'text/markdown'});
  if(format==='docx'){const doc=new Document({sections:[{children:reportMarkdown(p).split('\n').map(line=>new Paragraph({text:line.replace(/^#+ /,''),heading:line.startsWith('# ')?HeadingLevel.TITLE:line.startsWith('## ')?HeadingLevel.HEADING_1:undefined}))}]});return Packer.toBlob(doc);}
  if(format==='zip'){const zip=new JSZip();for(const kind of ['json','drawio','svg','md','docx','pdf'] as const){const blob=await exportArtifact(p,kind);zip.file(`architecture.${kind}`,await blobBytes(blob));}if(typeof CanvasRenderingContext2D!=='undefined'){const image=await exportArtifact(p,'png');zip.file('architecture.png',await blobBytes(image));}zip.file('README.txt',`PNG ${typeof CanvasRenderingContext2D!=='undefined'?'included':'unavailable: this runtime has no browser canvas; use the separate PNG export in a browser'}. Active diagram: ${activeVariant(p).name}. Editable Draw.io and SVG require manual import verification.`);return zip.generateAsync({type:'blob'});}
  const graph=await layoutProject(p);if(format==='drawio')return new Blob([drawioXml(graph)],{type:'application/xml'});if(format==='svg')return new Blob([graphSvg(graph)],{type:'image/svg+xml'});if(format==='png')return png(graphSvg(graph));return pdf(p,graph);
}
