import { describe, expect, it } from 'vitest';
import { createDrawing, drawingLayout, duplicateDrawing, editDrawing, parseDrawing, removeDrawingNode, type DrawingKind } from './model';
import { assetLibraries, drawingAssets } from './assets';
const node = (shape: 'process' | 'participant' | 'entity' | 'asset' = 'process') => ({ id: crypto.randomUUID(), label: 'A & <B>', shape, x: 40, y: 50, fields: shape === 'entity' ? ['id UUID PK'] : [], ...(shape === 'asset' ? { assetId: 'oracle/compute' } : {}) });
describe('independent drawing contracts', () => {
    it.each(['flowchart', 'sequence', 'er', 'infrastructure'] as DrawingKind[])('round-trips %s with stable IDs', kind => {
        const drawing = createDrawing(crypto.randomUUID(), kind);
        drawing.nodes.push(node(kind === 'sequence' ? 'participant' : kind === 'er' ? 'entity' : kind === 'infrastructure' ? 'asset' : 'process'));
        expect(parseDrawing(JSON.parse(JSON.stringify(drawing)))).toEqual(drawing);
    });
    it('rejects future versions, credentials, incompatible shapes and dangling references', () => {
        const drawing = createDrawing(crypto.randomUUID(), 'flowchart');
        expect(() => parseDrawing({ ...drawing, version: 99 })).toThrow('Unsupported drawing version');
        expect(() => parseDrawing({ ...drawing, apiKey: 'secret' })).toThrow();
        expect(() => editDrawing(drawing, d => { d.nodes.push(node('entity')); })).toThrow();
        expect(() => editDrawing(drawing, d => { d.edges.push({ id: crypto.randomUUID(), source: crypto.randomUUID(), target: crypto.randomUUID(), label: '' }); })).toThrow();
    });
    it('validates unique IDs, asset references and ER cardinality', () => {
        const drawing = createDrawing(crypto.randomUUID(), 'infrastructure');
        const asset = node('asset'); drawing.nodes.push(asset);
        expect(() => editDrawing(drawing, d => { d.nodes.push(asset); })).toThrow();
        expect(() => editDrawing(drawing, d => { d.nodes[0].assetId = 'unknown/remote'; })).toThrow();
        const er = createDrawing(crypto.randomUUID(), 'er'); er.nodes.push(node('entity'), node('entity'));
        expect(() => editDrawing(er, d => { d.edges.push({ id: crypto.randomUUID(), source: d.nodes[0].id, target: d.nodes[1].id, label: 'owns' }); })).toThrow();
    });
    it('deletes connected nodes atomically and remaps duplicate references', () => {
        const drawing = createDrawing(crypto.randomUUID(), 'flowchart'); drawing.nodes.push(node(), node());
        drawing.edges.push({ id: crypto.randomUUID(), source: drawing.nodes[0].id, target: drawing.nodes[1].id, label: 'next' });
        const copy = duplicateDrawing(drawing, crypto.randomUUID());
        expect(copy.nodes[0].id).not.toBe(drawing.nodes[0].id); expect(copy.edges[0].source).toBe(copy.nodes[0].id);
        expect(removeDrawingNode(drawing, drawing.nodes[0].id).edges).toHaveLength(0); expect(drawing.edges).toHaveLength(1);
    });
    it('lays out sequence lifelines and messages in canonical order deterministically', () => {
        const drawing = createDrawing(crypto.randomUUID(), 'sequence'); drawing.nodes.push(node('participant'), node('participant'));
        drawing.edges.push({ id: crypto.randomUUID(), source: drawing.nodes[0].id, target: drawing.nodes[1].id, label: 'request' }, { id: crypto.randomUUID(), source: drawing.nodes[1].id, target: drawing.nodes[0].id, label: 'reply', reply: true });
        expect(drawingLayout(drawing)).toEqual(drawingLayout(drawing)); expect(drawingLayout(drawing).edges.map(e => e.y)).toEqual([160, 215]);
    });
    it('keeps negative-position shapes within export bounds', () => {
        const drawing = createDrawing(crypto.randomUUID(), 'flowchart'); drawing.nodes.push({ ...node(), x: -500, y: -200 });
        expect(drawingLayout(drawing).nodes[0].x).toBeGreaterThanOrEqual(0); expect(drawing.nodes[0].x).toBe(-500);
    });
    it('provides all seven libraries with unique assets', () => {
        expect(new Set(drawingAssets.map(a => a.id)).size).toBe(drawingAssets.length);
        for (const library of assetLibraries) expect(drawingAssets.filter(a => a.library === library).length).toBeGreaterThanOrEqual(6);
    });
});

it('round-trips third-party assets without changing existing drawing contracts',()=>{
 const drawing=createDrawing(crypto.randomUUID(),'infrastructure');
 drawing.nodes.push({...node('asset'),assetId:'tools/mongodb',label:'MongoDB'});
 expect(parseDrawing(JSON.parse(JSON.stringify(drawing)))).toEqual(drawing);
});
