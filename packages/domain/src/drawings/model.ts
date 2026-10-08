import { z } from 'zod';
import { drawingAsset } from './assets';
export const drawingKinds = ['flowchart', 'sequence', 'er', 'infrastructure'] as const;
export type DrawingKind = typeof drawingKinds[number];
export const drawingNames: Record<DrawingKind, string> = { flowchart: 'Flowchart', sequence: 'Sequence diagram', er: 'ER diagram', infrastructure: 'Infrastructure diagram' };
export const shapeKinds = ['process', 'decision', 'terminal', 'data', 'participant', 'entity', 'asset', 'image'] as const;
const nodeSchema = z.object({ id: z.string().uuid(), label: z.string().min(1), shape: z.enum(shapeKinds), assetId: z.string().optional(), imageData: z.string().max(7_000_000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/).optional(), imageWidth: z.number().positive().max(6000).optional(), imageHeight: z.number().positive().max(6000).optional(), fields: z.array(z.string()).default([]), x: z.number().finite(), y: z.number().finite() }).strict();
const edgeSchema = z.object({ id: z.string().uuid(), source: z.string().uuid(), target: z.string().uuid(), label: z.string(), relation: z.enum(['1:1', '1:N', 'N:M']).optional(), reply: z.boolean().optional() }).strict();
export const drawingSchema = z.object({ version: z.literal(2), id: z.string().uuid(), projectId: z.string().uuid(), kind: z.enum(drawingKinds), title: z.string().min(1), updatedAt: z.string().datetime(), nodes: z.array(nodeSchema), edges: z.array(edgeSchema) }).strict().superRefine((drawing, ctx) => {
    if(drawing.nodes.reduce((total,n)=>total+(n.imageData?.length??0),0)>7_000_000)ctx.addIssue({code:'custom',path:['nodes'],message:'Reference images exceed the 7 MB document limit'});
    const ids = new Set<string>([drawing.id]);
    const nodes = new Set(drawing.nodes.map(n => n.id));
    for (const [index, node] of drawing.nodes.entries()) {
        if (ids.has(node.id)) ctx.addIssue({ code: 'custom', path: ['nodes', index, 'id'], message: 'Duplicate ID' });
        ids.add(node.id);
        const allowed = drawing.kind === 'sequence' ? ['participant'] : drawing.kind === 'er' ? ['entity'] : drawing.kind === 'infrastructure' ? ['asset', 'image'] : ['process', 'decision', 'terminal', 'data', 'image'];
        if(node.shape === 'image' && (!node.imageData || !node.imageWidth || !node.imageHeight)) ctx.addIssue({code:'custom',path:['nodes',index],message:'Image data and dimensions required'});
        if(node.shape !== 'image' && (node.imageData || node.imageWidth || node.imageHeight)) ctx.addIssue({code:'custom',path:['nodes',index],message:'Only image nodes can contain image data'});
        if (!allowed.includes(node.shape)) ctx.addIssue({ code: 'custom', path: ['nodes', index, 'shape'], message: 'Shape is incompatible with diagram type' });
        if (node.shape !== 'asset' && node.assetId) ctx.addIssue({ code: 'custom', path: ['nodes', index, 'assetId'], message: 'Only infrastructure shapes can reference assets' });
        if (node.shape !== 'entity' && node.fields.length) ctx.addIssue({ code: 'custom', path: ['nodes', index, 'fields'], message: 'Only entities can have attributes' });
        if (node.shape === 'asset' && (!node.assetId || !drawingAsset(node.assetId))) ctx.addIssue({ code: 'custom', path: ['nodes', index, 'assetId'], message: 'Asset required' });
    }
    for (const [index, edge] of drawing.edges.entries()) {
        if (ids.has(edge.id)) ctx.addIssue({ code: 'custom', path: ['edges', index, 'id'], message: 'Duplicate ID' });
        ids.add(edge.id);
        if (!nodes.has(edge.source) || !nodes.has(edge.target)) ctx.addIssue({ code: 'custom', path: ['edges', index], message: 'Missing connection endpoint' });
        if (edge.source === edge.target && drawing.kind !== 'flowchart') ctx.addIssue({ code: 'custom', path: ['edges', index], message: 'Use distinct endpoints' });
        if (drawing.kind === 'er' && !edge.relation) ctx.addIssue({ code: 'custom', path: ['edges', index, 'relation'], message: 'Relationship cardinality required' });
    }
});
export type Drawing = z.infer<typeof drawingSchema>;
export type DrawingNode = Drawing['nodes'][number];
export function parseDrawing(value: unknown): Drawing {
    if (typeof value === 'object' && value !== null && 'version' in value && value.version !== 1 && value.version !== 2) throw new Error(`Unsupported drawing version ${String(value.version)}; supported versions are 1 and 2.`);
    const legacy=typeof value === 'object' && value !== null && 'version' in value && value.version === 1;
    const drawing=drawingSchema.parse(legacy ? {...value,version:2} : value);
    if(legacy && drawing.nodes.some(n=>n.shape==='image'))throw new Error('Invalid version 1 drawing: image nodes require version 2.');
    return drawing;
}
export function createDrawing(projectId: string, kind: DrawingKind): Drawing {
    return parseDrawing({ version: 2, id: crypto.randomUUID(), projectId, kind, title: drawingNames[kind], updatedAt: new Date().toISOString(), nodes: [], edges: [] });
}
export function editDrawing(drawing: Drawing, edit: (draft: Drawing) => void): Drawing {
    const next = structuredClone(drawing); edit(next); next.updatedAt = new Date().toISOString(); return parseDrawing(next);
}
export function removeDrawingNode(drawing: Drawing, id: string): Drawing {
    return editDrawing(drawing, next => { next.nodes = next.nodes.filter(n => n.id !== id); next.edges = next.edges.filter(e => e.source !== id && e.target !== id); });
}
export function duplicateDrawing(drawing: Drawing, projectId = drawing.projectId): Drawing {
    const ids = new Map(drawing.nodes.map(node => [node.id, crypto.randomUUID()]));
    return parseDrawing({ ...structuredClone(drawing), id: crypto.randomUUID(), projectId, title: `${drawing.title} (copy)`, updatedAt: new Date().toISOString(), nodes: drawing.nodes.map(node => ({ ...node, id: ids.get(node.id)! })), edges: drawing.edges.map(edge => ({ ...edge, id: crypto.randomUUID(), source: ids.get(edge.source)!, target: ids.get(edge.target)! })) });
}
export function drawingLayout(drawing: Drawing) {
    const d = parseDrawing(drawing);
    const nodes = d.nodes.map((node, index) => ({ ...node, x: d.kind === 'sequence' ? 40 + index * 230 : node.x, y: d.kind === 'sequence' ? 40 : node.y, width: node.shape === 'image' ? node.imageWidth! : 180, height: node.shape === 'image' ? node.imageHeight! : node.shape === 'entity' ? Math.max(88, 52 + node.fields.length * 22) : 80 }));
    if (d.kind !== 'sequence' && nodes.length) { const dx = Math.min(0, ...nodes.map(n => n.x - 20)), dy = Math.min(0, ...nodes.map(n => n.y - 20)); nodes.forEach(n => { n.x -= dx; n.y -= dy; }); }
    const edges = d.edges.map((edge, index) => ({ ...edge, y: d.kind === 'sequence' ? 160 + index * 55 : undefined }));
    return { nodes, edges, width: Math.max(600, ...nodes.map(n => n.x + n.width + 40)), height: Math.max(400, ...nodes.map(n => n.y + n.height + 40), d.kind === 'sequence' ? 230 + d.edges.length * 55 : 0) };
}
