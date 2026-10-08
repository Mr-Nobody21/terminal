import { assetUrl } from '@planner/adapters/backend/assets';
import { useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, applyNodeChanges, type Node, type NodeProps, type Edge, type Connection, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { activeVariant, commit, newId, type Project } from '@planner/domain/model';
import { serviceFor } from '@planner/domain/providers';
import { layoutProject } from '@planner/domain/diagram/layout';
type ServiceData = {
    label: string;
    icon: string;
    service: string;
    unsupported: boolean;
};
function ServiceNode({ data }: NodeProps<Node<ServiceData>>) { return <div className={`service-node ${data.unsupported ? 'unsupported' : ''}`}><Handle type="target" position={Position.Left}/><img src={data.icon} alt="" onError={e => { e.currentTarget.src = assetUrl('/icons/fallback.svg'); }}/><div><strong>{data.label}</strong><small>{data.service}</small></div><Handle type="source" position={Position.Right}/></div>; }
function BoundaryNode({data}:NodeProps<Node<{label:string}>>){return <div className="boundary-node">{data.label}</div>;}
const nodeTypes = { service: ServiceNode,boundary:BoundaryNode };
export function Diagram({ project, onChange, onSelect, selectedId, onError, tool = 'select', snap = true, onAddService, active = true }: {
    active?: boolean;
    tool?: 'select' | 'pan';
    snap?: boolean;
    onAddService?: (service: string, position: { x: number; y: number }) => void;
    project: Project;
    onChange: (p: Project) => void;
    onSelect: (id: string | undefined) => void;
    selectedId?: string;
    onError: (message: string) => void;
}) {
    const container = useRef<HTMLDivElement>(null);
    const [flow, setFlow] = useState<ReactFlowInstance>();
    const [nodes, setNodes] = useState<Node[]>([]), [edges, setEdges] = useState<Edge[]>([]), [loading, setLoading] = useState(true);
    useEffect(() => { let stale = false; setLoading(true); layoutProject(project).then(graph => { if (stale)
        return; setNodes(graph.nodes.map(n => ({ id: n.id, type: n.kind === 'boundary' ? 'boundary' : 'service', position: { x: n.x, y: n.y }, style: { width: n.width, height: n.height, ...(n.kind === 'boundary' ? { background: 'var(--boundary-fill, rgba(231,238,248,0.45))', border: '1px dashed var(--boundary-border, #9cabc0)', zIndex: -1 } : {}) }, data: n.resource ? { label: n.label, icon: assetUrl(serviceFor(n.resource.provider, n.resource.service)?.icon ?? '/icons/fallback.svg'), service: `${n.resource.provider.toUpperCase()} · ${serviceFor(n.resource.provider, n.resource.service)?.name ?? n.resource.service}`, unsupported: n.resource.unsupported } : { label: n.label }, selected: n.id === selectedId, draggable: n.kind === 'resource' }))); setEdges(graph.edges.map(e => ({ ...e, animated: false, selected: e.id === selectedId }))); setLoading(false); }).catch(e => { if (!stale) {
        onError(e instanceof Error ? e.message : 'Layout failed');
        setLoading(false);
    } }); return () => { stale = true; }; }, [project, selectedId, onError]);
    useEffect(() => {
        if (!active || !flow || !nodes.length || !container.current) return;
        let frame = 0;
        // Fit after the canvas becomes measurable, including returning from the dashboard.
        const observer = new ResizeObserver(entries => {
            if (!entries.some(entry => entry.contentRect.width > 0 && entry.contentRect.height > 0)) return;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { void flow.fitView({ padding: 0.25, maxZoom: 1, duration: 0 }); });
        });
        observer.observe(container.current);
        return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }, [active, flow, nodes.length, project.id, project.activeVariantId]);
    const connect = (connection: Connection) => { if (!connection.source || !connection.target)
        return; onChange(commit(project, d => { activeVariant(d).connections.push({ id: newId(), source: connection.source!, target: connection.target!, label: 'Connection' }); })); };
    return <div ref={container} className="diagram" aria-label="Editable architecture diagram" onDragOver={e => { if (e.dataTransfer.types.includes('application/x-planner-service')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }} onDrop={e => {
        const service = e.dataTransfer.getData('application/x-planner-service');
        if (!flow || !service) return;
        e.preventDefault();
        const position = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onAddService?.(service, snap ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 } : position);
    }}>{loading && <span className="layout-status" role="status">Laying out architecture…</span>}{!loading&&!activeVariant(project).resources.length&&<span className="layout-status">Drag a service from Shapes to begin, or click a shape to add it.</span>}<ReactFlow onInit={setFlow} snapToGrid={snap} snapGrid={[20, 20]} panOnDrag={tool === 'pan' ? true : [1, 2]} selectionOnDrag={tool === 'select'} nodesDraggable={tool === 'select'} nodesConnectable={tool === 'select'} nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes => setNodes(prev => applyNodeChanges(changes, prev))} defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#7186a5', strokeWidth: 1.5 } }} onNodeClick={(_, n) => onSelect(n.id)} onEdgeClick={(_, e) => onSelect(e.id)} onPaneClick={() => onSelect(undefined)} onNodeDragStop={(_, n) => onChange(commit(project, d => { d.presentation.positions[n.id] = { x: n.position.x, y: n.position.y }; }))} onConnect={connect} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1 }} minZoom={0.2} maxZoom={2} deleteKeyCode={null} aria-label="Architecture canvas"><Background gap={22} size={1}/><Controls /></ReactFlow></div>;
}
