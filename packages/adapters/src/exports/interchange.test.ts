import { describe,it,expect } from 'vitest';
import JSZip from 'jszip';
import { sampleProject } from '@planner/domain/examples';
import { createDrawing,parseDrawing } from '@planner/domain/drawings/model';
import { blobBytes,reportMarkdown } from './artifacts';
import { excelExport,excelImport,mermaidExport,parseMermaid,textImport,xmlExport,validateDocument,validateWorkbookArchive } from './interchange';
const projectId=crypto.randomUUID();
describe('file interoperability',()=>{
 it('round-trips mixed architecture XML and Mermaid with stable metadata and escaped text',async()=>{
  const project=sampleProject();project.name='Quotes " < & emoji 🪷';project.variants[0].resources[0].name=project.name;
  const data={project};expect(textImport(mermaidExport(data),'mmd',projectId)).toEqual(data);expect(textImport(mermaidExport(data).replace(/\n/g,'\r\n'),'mmd',projectId)).toEqual(data);const exported=await xmlExport(data);expect(new DOMParser().parseFromString(exported,'application/xml').querySelector('parsererror')).toBeNull();expect(textImport(exported,'xml',projectId)).toEqual(data);
 });
 it('imports plain editable Mermaid flowcharts, sequences and ER relationships',()=>{
  const flow=parseMermaid('flowchart LR\nA["API"]\nB{"Ready?"}\nA -->|"HTTPS"| B',projectId);expect(flow.nodes.map(n=>n.label)).toEqual(['API','Ready?']);expect(flow.edges[0].label).toBe('HTTPS');
  const sequence=parseMermaid('sequenceDiagram\nparticipant A as Client\nA->>B: Request\nB-->>A: Response',projectId);expect(sequence.kind).toBe('sequence');expect(sequence.edges[1].reply).toBe(true);
  const er=parseMermaid('erDiagram\nUSER {\n uuid id PK\n}\nUSER ||--o{ ORDER : owns',projectId);expect(er.nodes[0].fields).toEqual(['uuid id PK']);expect(er.edges[0].relation).toBe('1:N');
  expect(()=>parseMermaid('flowchart LR\nsubgraph unsupported',projectId)).toThrow('Unsupported');
 });
 it('uses visible changes rather than stale embedded data',()=>{
  const project=sampleProject(),mmd=mermaidExport({project}).replace('CloudFront','Edited CDN');const imported=textImport(mmd,'mmd',projectId);expect('drawing' in imported&&imported.drawing.nodes.some(n=>n.label==='Edited CDN')).toBe(true);
 });
 it('imports external uncompressed Draw.io, flattens group offsets and rejects unsafe/broken XML',()=>{
  const text='<mxfile><mxCell id="g" vertex="1" value="Group"><mxGeometry x="100" y="50"/></mxCell><mxCell id="a" vertex="1" parent="g" value="A &amp; B"><mxGeometry x="10" y="20"/></mxCell><mxCell id="b" vertex="1" value="B"/><mxCell id="e" edge="1" source="a" target="b" value="Link"/></mxfile>';
  const result=textImport(text,'xml',projectId);if(!('drawing' in result))throw new Error();expect(result.drawing.nodes[1]).toMatchObject({label:'A & B',x:110,y:70});expect(result.drawing.edges).toHaveLength(1);
  expect(()=>textImport('<!DOCTYPE foo><foo/>','xml',projectId)).toThrow('entities');expect(()=>textImport('<mxfile>','xml',projectId)).toThrow('Invalid XML');expect(()=>textImport('<mxfile><mxCell id="e" edge="1" source="bad"/></mxfile>','xml',projectId)).toThrow('endpoints');
 });
 it('exports real OOXML, includes readable cost overview and imports edited resource rows',async()=>{
  const project=sampleProject();project.name='Unicode 🪷';const blob=await excelExport({project}),bytes=await blobBytes(blob);expect(await excelImport(bytes)).toEqual({project});
  const zip=await JSZip.loadAsync(bytes);expect(await zip.file('xl/worksheets/sheet3.xml')!.async('string')).toContain('Known monthly subtotal');let sheet=await zip.file('xl/worksheets/sheet1.xml')!.async('string');sheet=sheet.replace('CloudFront','Edited CDN');zip.file('xl/worksheets/sheet1.xml',sheet);const imported=await excelImport(await zip.generateAsync({type:'arraybuffer'}));expect('project' in imported&&imported.project.variants[0].resources[0].name).toBe('Edited CDN');
  zip.file('xl/worksheets/sheet1.xml',sheet.replace('us-east-1','invalid-region'));await expect(excelImport(await zip.generateAsync({type:'arraybuffer'}))).rejects.toThrow();expect(project.variants[0].resources[0].name).toBe('CloudFront');
 });
 it('round-trips image drawings and excludes costs in simple reports',async()=>{
  const drawing=createDrawing(projectId,'infrastructure');drawing.nodes.push({id:crypto.randomUUID(),shape:'image',label:'reference.png',fields:[],x:20,y:30,imageData:'data:image/png;base64,aGVsbG8=',imageWidth:200,imageHeight:100});
  const data={drawing};expect(textImport(mermaidExport(data),'mmd',projectId)).toEqual(data);expect(textImport(await xmlExport(data),'xml',projectId)).toEqual(data);expect(await excelImport(await blobBytes(await excelExport(data)))).toEqual(data);
  expect(parseDrawing({...drawing,version:1,nodes:[]})).toEqual({...drawing,nodes:[]});expect(()=>parseDrawing({...drawing,version:1})).toThrow('image nodes require version 2');expect(()=>parseDrawing({...drawing,nodes:[{...drawing.nodes[0],imageData:'https://evil.test/image.png'}]})).toThrow();
  const project=sampleProject();project.costEnabled=false;expect(reportMarkdown(project)).toContain('Cost calculations disabled');expect(reportMarkdown(project)).not.toContain('Known monthly subtotal');expect(()=>validateDocument({project:{...project,apiKey:'secret'}})).toThrow();
 });
 it('rejects invalid and oversized ZIP directories before decompression',async()=>{expect(()=>validateWorkbookArchive(new ArrayBuffer(0))).toThrow('Invalid XLSX');const zip=new JSZip();zip.file('large.xml','x'.repeat(15_000_001));const bytes=await zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'});expect(()=>validateWorkbookArchive(bytes)).toThrow('expanded size');});
 it('migrates version 2 projects with costs enabled and preserves explicit simple mode',()=>{
  const project=sampleProject();const {costEnabled:_mode,...legacy}=project;void _mode;expect(validateDocument({project:{...legacy,version:2}})).toEqual({project});project.costEnabled=false;expect(validateDocument({project})).toEqual({project});
 });
});
