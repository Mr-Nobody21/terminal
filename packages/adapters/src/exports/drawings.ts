import { drawingLayout, parseDrawing, type Drawing } from '@planner/domain/drawings/model';
import { drawingAsset } from '@planner/domain/drawings/assets';
import { escapeXml } from './xml';
import { assetUrl } from '../backend/assets';
export function drawingIconData(id:string):string {const asset=drawingAsset(id);return asset?assetUrl(asset.icon):'';}
export function drawingSvg(drawing: Drawing): string {
    const d = parseDrawing(drawing), graph = drawingLayout(d);
    const nodes = graph.nodes.map(n => {
        const wrap = (value: string) => `<g data-node-id="${n.id}">${value}</g>`;
        const label = `<text x="${n.x + n.width / 2}" y="${n.y + 44}" text-anchor="middle" font-family="sans-serif" font-size="13">${escapeXml(n.label)}</text>`;
        const body = n.shape === 'decision' ? `<polygon points="${n.x + 90},${n.y} ${n.x + 180},${n.y + 40} ${n.x + 90},${n.y + 80} ${n.x},${n.y + 40}" fill="white" stroke="#94a3b8"/>` : n.shape === 'data' ? `<polygon points="${n.x + 20},${n.y} ${n.x + 180},${n.y} ${n.x + 160},${n.y + 80} ${n.x},${n.y + 80}" fill="white" stroke="#94a3b8"/>` : `<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${n.shape === 'terminal' ? 35 : 6}" fill="white" stroke="#94a3b8"/>`;
        if(n.shape === 'image') return wrap(`<image href="${escapeXml(n.imageData!)}" x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}"/><title>${escapeXml(n.label)}</title>`);
        if (d.kind === 'sequence') return wrap(body + label + `<path d="M${n.x + 90} ${n.y + 80}V${graph.height - 30}" stroke="#94a3b8" stroke-dasharray="5 5"/>`);
        if (n.shape === 'asset') return wrap(body + `<image href="${escapeXml(drawingIconData(n.assetId!))}" x="${n.x + 12}" y="${n.y + 12}" width="36" height="36"/><text x="${n.x + 12}" y="${n.y + 67}" font-family="sans-serif" font-size="12">${escapeXml(n.label)}</text>`);
        if (n.shape === 'entity') return wrap(body + label + n.fields.map((field, i) => `<text x="${n.x + 12}" y="${n.y + 62 + i * 22}" font-family="monospace" font-size="11">${escapeXml(field)}</text>`).join(''));
        return wrap(body + label);
    }).join('');
    const edges = graph.edges.map((e, i) => {
        const a = graph.nodes.find(n => n.id === e.source)!, b = graph.nodes.find(n => n.id === e.target)!;
        const sequence = d.kind === 'sequence', x1 = sequence ? a.x + 90 : a.x + a.width, x2 = sequence ? b.x + 90 : b.x, y1 = e.y ?? a.y + a.height / 2, y2 = e.y ?? b.y + b.height / 2;
        const label = `${sequence ? `${i + 1}. ` : ''}${e.label}${e.relation ? ` (${e.relation})` : ''}`;
        return `<g data-edge-id="${e.id}"><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#64748b" fill="none" marker-end="url(#arrow)"${e.reply ? ' stroke-dasharray="5 4"' : ''}/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" font-family="sans-serif" font-size="11">${escapeXml(label)}</text></g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${graph.width}" height="${graph.height}" viewBox="0 0 ${graph.width} ${graph.height}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#64748b"/></marker></defs><rect width="100%" height="100%" fill="#fcfbf8"/>${nodes}${edges}</svg>`;
}
export function drawingDrawio(drawing: Drawing): string {
    const d = parseDrawing(drawing), graph = drawingLayout(d);
    const nodes = graph.nodes.map(n => {
        const style = n.shape === 'image' ? `shape=image;image=${n.imageData};imageAspect=1;` : n.shape === 'decision' ? 'rhombus;' : n.shape === 'data' ? 'shape=parallelogram;' : n.shape === 'terminal' ? 'rounded=1;arcSize=50;' : n.shape === 'asset' ? `shape=image;image=${drawingIconData(n.assetId!)};verticalLabelPosition=bottom;verticalAlign=top;` : 'rounded=0;';
        const label = [n.label, ...n.fields].join('\n');
        return `<mxCell id="${n.id}" value="${escapeXml(label)}" style="${style}html=0;whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" as="geometry"/></mxCell>${d.kind === 'sequence' ? `<mxCell id="life-${n.id}" edge="1" parent="1" style="dashed=1;endArrow=none;"><mxGeometry relative="1" as="geometry"><mxPoint x="${n.x + 90}" y="120" as="sourcePoint"/><mxPoint x="${n.x + 90}" y="${graph.height - 30}" as="targetPoint"/></mxGeometry></mxCell>` : ''}`;
    }).join('');
    const edges = graph.edges.map((e, i) => {
        const a = graph.nodes.find(n => n.id === e.source)!, b = graph.nodes.find(n => n.id === e.target)!;
        const seq = d.kind === 'sequence';
        return `<mxCell id="${e.id}" value="${escapeXml(`${seq ? `${i + 1}. ` : ''}${e.label}${e.relation ? ` (${e.relation})` : ''}`)}" edge="1" parent="1"${seq ? '' : ` source="${e.source}" target="${e.target}"`} style="html=0;endArrow=block;${e.reply ? 'dashed=1;' : ''}"><mxGeometry relative="1" as="geometry">${seq ? `<mxPoint x="${a.x + 90}" y="${e.y}" as="sourcePoint"/><mxPoint x="${b.x + 90}" y="${e.y}" as="targetPoint"/>` : ''}</mxGeometry></mxCell>`;
    }).join('');
    return `<?xml version="1.0"?><mxfile><diagram name="${escapeXml(d.title)}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${nodes}${edges}</root></mxGraphModel></diagram></mxfile>`;
}
export type DrawingExport = 'json' | 'svg' | 'drawio';
export function exportDrawing(drawing: Drawing, format: DrawingExport): Blob {
    const d = parseDrawing(drawing);
    return new Blob([format === 'json' ? JSON.stringify(d, null, 2) : format === 'svg' ? drawingSvg(d) : drawingDrawio(d)], { type: format === 'json' ? 'application/json' : format === 'svg' ? 'image/svg+xml' : 'application/xml' });
}
