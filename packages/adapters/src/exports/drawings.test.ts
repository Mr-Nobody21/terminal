import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createDrawing, type DrawingKind } from '@planner/domain/drawings/model';
import { drawingAssets } from '@planner/domain/drawings/assets';
import { drawingDrawio, drawingIconData, drawingSvg } from './drawings';
describe('editable drawing exports and bundled assets', () => {
    it.each(['flowchart', 'sequence', 'er', 'infrastructure'] as DrawingKind[])('escapes %s labels and preserves editable nodes/connectors', kind => {
        const d = createDrawing(crypto.randomUUID(), kind); const shape = kind === 'sequence' ? 'participant' : kind === 'er' ? 'entity' : kind === 'infrastructure' ? 'asset' : 'decision';
        d.nodes = [0, 1].map(i => ({ id: crypto.randomUUID(), label: `A & <B> ${i}`, shape, x: 50 + i * 220, y: 100, fields: kind === 'er' ? ['id <UUID> PK'] : [], ...(kind === 'infrastructure' ? { assetId: 'oracle/compute' } : {}) }));
        d.edges.push({ id: crypto.randomUUID(), source: d.nodes[0].id, target: d.nodes[1].id, label: 'a < b & c', ...(kind === 'er' ? { relation: '1:N' as const } : {}) });
        for (const source of [drawingSvg(d), drawingDrawio(d)]) {
            const xml = new DOMParser().parseFromString(source, 'application/xml'); expect(xml.querySelector('parsererror')).toBeNull(); expect(source).toContain('&amp;');
        }
        const xml = new DOMParser().parseFromString(drawingDrawio(d), 'application/xml'); expect(xml.querySelectorAll('[vertex="1"]')).toHaveLength(2); expect(xml.querySelectorAll('[edge="1"]').length).toBeGreaterThanOrEqual(1);
        if (kind === 'sequence') { expect(drawingSvg(d)).toContain('stroke-dasharray="5 5"'); expect(drawingDrawio(d)).toContain('sourcePoint'); }
        if (kind === 'er') expect(drawingDrawio(d)).toContain('1:N');
    });
    it('bundles valid local icons for every asset and embeds them without network URLs', () => {
        for (const asset of drawingAssets) {
            expect(existsSync(`backend/assets${asset.icon}`)).toBe(true);
            const svg = readFileSync(`backend/assets${asset.icon}`, 'utf8'); expect(new DOMParser().parseFromString(svg, 'application/xml').querySelector('parsererror')).toBeNull();
            expect(drawingIconData(asset.id)).toContain('data:image/svg+xml,'); expect(decodeURIComponent(drawingIconData(asset.id))).toContain('<svg');
        }
    });
});
