import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Node, type NodeProps, type Edge, type Connection } from '@xyflow/react';
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
function ServiceNode({ data }: NodeProps<Node<ServiceData>>) { return <div className={`service-node ${data.unsupported ? 'unsupported' : ''}`}><Handle type="target" position={Position.Left}/><img src={data.icon} alt="" onError={e => { e.currentTarget.src = `${import.meta.env.BASE_URL}icons/fallback.svg`; }}/><div><strong>{data.label}</strong><small>{data.service}</small></div><Handle type="source" position={Position.Right}/></div>; }
function BoundaryNode({data}:NodeProps<Node<{label:string}>>){return <div className="boundary-node">{data.label}</div>;}
const nodeTypes = { service: ServiceNode,boundary:BoundaryNode };
export function Diagram({ project, onChange, onSelect, selectedId, onError }: {
    project: Project;
    onChange: (p: Project) => void;
    onSelect: (id: string | undefined) => void;
    selectedId?: string;
    onError: (message: string) => void;
}) {
    const [nodes, setNodes] = useState<Node[]>([]), [edges, setEdges] = useState<Edge[]>([]), [loading, setLoading] = useState(true);
    useEffect(() => { let stale = false; setLoading(true); layoutProject(project).then(graph => { if (stale)
        return; setNodes(graph.nodes.map(n => ({ id: n.id, type: n.kind === 'boundary' ? 'boundary' : 'service', position: { x: n.x, y: n.y }, style: { width: n.width, height: n.height, ...(n.kind === 'boundary' ? { background: 'rgba(231,238,248,0.45)', border: '1px dashed #9cabc0', zIndex: -1 } : {}) }, data: n.resource ? { label: n.label, icon: `${import.meta.env.BASE_URL}${(serviceFor(n.resource.provider, n.resource.service)?.icon ?? '/icons/fallback.svg').slice(1)}`, service: serviceFor(n.resource.provider, n.resource.service)?.name ?? n.resource.service, unsupported: n.resource.unsupported } : { label: n.label }, selected: n.id === selectedId, draggable: n.kind === 'resource' }))); setEdges(graph.edges.map(e => ({ ...e, animated: false, selected: e.id === selectedId }))); setLoading(false); }).catch(e => { if (!stale) {
        onError(e instanceof Error ? e.message : 'Layout failed');
        setLoading(false);
    } }); return () => { stale = true; }; }, [project, selectedId, onError]);
    const connect = (connection: Connection) => { if (!connection.source || !connection.target)
        return; onChange(commit(project, d => { activeVariant(d).connections.push({ id: newId(), source: connection.source!, target: connection.target!, label: 'Connection' }); })); };
    return <div className="diagram" aria-label="Editable architecture diagram">{loading && <span className="layout-status" role="status">Laying out architecture…</span>}{!loading&&!activeVariant(project).resources.length&&<span className="layout-status">No services yet. Choose a service above to begin.</span>}<ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes => setNodes(prev => prev.map(n => { const change = changes.find(c => c.type === 'position' && c.id === n.id); return change?.type === 'position' && change.position ? { ...n, position: change.position } : n; }))} onNodeClick={(_, n) => onSelect(n.id)} onEdgeClick={(_, e) => onSelect(e.id)} onPaneClick={() => onSelect(undefined)} onNodeDragStop={(_, n) => onChange(commit(project, d => { d.presentation.positions[n.id] = { x: n.position.x, y: n.position.y }; }))} onConnect={connect} fitView fitViewOptions={{ padding: 0.15 }} minZoom={0.2} maxZoom={2} deleteKeyCode={null} aria-label="Architecture canvas"><Background gap={22} size={1}/><Controls /></ReactFlow></div>;
}
