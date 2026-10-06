import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { activeVariant, parseProject, type Project, type Resource } from '../model/index';
export type GraphNode = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    kind: 'resource' | 'boundary';
    parentId?: string;
    resource?: Resource;
};
export type GraphEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
};
export type Graph = {
    nodes: GraphNode[];
    edges: GraphEdge[];
    width: number;
    height: number;
};
const elk = new ELK();
export async function layoutProject(project: Project, usePositions = true): Promise<Graph> {
    const p = parseProject(project), v = activeVariant(p);
    const sort = <T extends {
        id: string;
    }>(items: T[]) => [...items].sort((a, b) => a.id.localeCompare(b.id));
    const children = (parentId?: string): ElkNode[] => [
        ...sort(v.boundaries.filter(b => b.parentId === parentId)).map(b => ({ id: b.id, children: children(b.id), layoutOptions: { 'elk.padding': '[top=44,left=24,bottom=24,right=24]' } })),
        ...sort(v.resources.filter(r => r.boundaryId === parentId)).map(r => ({ id: r.id, width: 184, height: 82 })),
    ];
    const output: ElkNode = await elk.layout({ id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.spacing.nodeNode': '36', 'elk.layered.spacing.nodeNodeBetweenLayers': '70', 'elk.padding': '[top=20,left=20,bottom=20,right=20]' }, children: children(), edges: sort(v.connections).map(c => ({ id: c.id, sources: [c.source], targets: [c.target] })) });
    const nodes: GraphNode[] = [];
    const collect = (items: ElkNode[], px = 0, py = 0, parentId?: string) => { for (const n of items) {
        const saved = usePositions ? p.presentation.positions[n.id] : undefined;
        const x = saved?.x ?? px + (n.x ?? 0), y = saved?.y ?? py + (n.y ?? 0);
        const r = v.resources.find(r => r.id === n.id), b = v.boundaries.find(b => b.id === n.id);
        nodes.push({ id: n.id, x, y, width: n.width ?? 184, height: n.height ?? 82, label: r?.name ?? b?.name ?? '', kind: r ? 'resource' : 'boundary', parentId, resource: r });
        if (n.children)
            collect(n.children, x, y, n.id);
    } };
    collect(output.children ?? []);
    return { nodes, edges: sort(v.connections).map(({ id, source, target, label }) => ({ id, source, target, label })), width: Math.max(output.width ?? 400, ...nodes.map(n => n.x + n.width + 30)), height: Math.max(output.height ?? 240, ...nodes.map(n => n.y + n.height + 30)) };
}
