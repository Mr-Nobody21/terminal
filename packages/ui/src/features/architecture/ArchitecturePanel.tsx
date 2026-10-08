import { assetUrl } from '@planner/adapters/backend/assets';
import { useEffect, useRef, useState } from 'react';
import type { LoadedWorkspace } from '../../app/useWorkspace';
import { activeVariant, commit, newId } from '@planner/domain/model';
import { makeResource } from '@planner/domain/examples';
import { categories, inventorySources, services, serviceFor, providers, type Provider } from '@planner/domain/providers';
import { assetLibraries, drawingAssets, libraryNames, type AssetLibrary } from '@planner/domain/drawings/assets';
import { Diagram } from '../diagram/Diagram';
import { Inspector } from './Inspector';
export function ArchitecturePanel({ workspace, shapesOpen, onCloseShapes, onOpenInfrastructure }: {
    onOpenInfrastructure: (library: AssetLibrary) => void;
    shapesOpen: boolean;
    onCloseShapes: () => void;
    workspace: Pick<LoadedWorkspace, 'project' | 'selected' | 'setSelected' | 'change' | 'past' | 'future' | 'undo' | 'redo' | 'service' | 'setService' | 'run' | 'reportError' | 'from' | 'setFrom' | 'to' | 'setTo' | 'connectionLabel' | 'setConnectionLabel' | 'switchProject'>;
}) {
    const { project, selected, setSelected, change, past, future, undo, redo, service, setService, run, reportError, from, setFrom, to, setTo, connectionLabel, setConnectionLabel } = workspace;
    const connectionsRef = useRef<HTMLDetailsElement>(null);
    const select = (id: string | undefined) => { setSelected(id); if (connectionsRef.current) connectionsRef.current.open = false; };
    const [search, setSearch] = useState('');
    const [library, setLibrary] = useState<AssetLibrary>(project.provider);
    useEffect(() => { setLibrary(project.provider); setSearch(''); }, [project.provider]);
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [snap, setSnap] = useState(true);
    const v = activeVariant(project);
    const catalog = services.filter(s => s.provider === library && `${s.name} ${s.category}`.toLowerCase().includes(search.toLowerCase()));
    const addService = (serviceId: string, position?: { x: number; y: number }) => run(() => {
        if (!providers.includes(library as Provider) || !serviceFor(library as Provider, serviceId)) return;
        const resource = makeResource(project, serviceId, providers.includes(library as Provider) ? library as Provider : project.provider);
        change(commit(project, draft => {
            activeVariant(draft).resources.push(resource);
            if (position) draft.presentation.positions[resource.id] = position;
        }));
        setSelected(resource.id);
    });
    const addBlankVariant = () => run(() => {
        const id = newId();
        change(commit(project, draft => {
            draft.variants.push({ id, name: 'Manual', description: 'Blank manual diagram', resources: [], connections: [], boundaries: [] });
            draft.activeVariantId = id;
        }));
        setSelected(undefined);
    });
    const addBoundary = () => run(() => {
        const id = newId();
        change(commit(project, draft => { activeVariant(draft).boundaries.push({ id, name: 'Network boundary', kind: 'network' }); }));
        setSelected(id);
    });
    return <section className="canvas-panel diagram-editor contextual-editor">
        <div className="panel-title"><h2 className="sr-only">Architecture</h2><select aria-label="Architecture variant" value={project.activeVariantId} onChange={e => { change(commit(project, d => { d.activeVariantId = e.target.value; })); setSelected(undefined); }}>{project.variants.map((variant, index) => <option key={variant.id} value={variant.id}>{variant.name}{project.variants.filter(item => item.name === variant.name).length > 1 ? ` · ${index + 1}` : ''}</option>)}</select></div>
        <div className="canvas-toolbar" role="toolbar" aria-label="Diagram tools">
            <button aria-pressed={tool === 'select'} onClick={() => setTool('select')}>Select</button><button aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}>Pan</button>
            <span className="toolbar-divider"/>
            <button disabled={!past.length} onClick={undo}>Undo</button><button disabled={!future.length} onClick={redo}>Redo</button>
            <details className="more-tools"><summary aria-label="More diagram tools">•••</summary><div className="more-tools-content"><button onClick={() => change(commit(project, d => { d.presentation.positions = {}; }))}>Auto layout</button>
            <button aria-pressed={snap} onClick={() => setSnap(!snap)}>Snap to grid</button><button onClick={addBoundary}>Add boundary</button><button onClick={addBlankVariant}>New blank variant</button>
            <div className="connection-builder"><select aria-label="Service to add" value={service} onChange={e => setService(e.target.value)}><option value="">Choose service</option>{services.filter(s => s.provider === library).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={!service} onClick={() => addService(service)}>Add service</button></div>
            </div></details>
        </div>
        <div className="editor-body">
            <aside className="service-palette" aria-label="Service palette" hidden={!shapesOpen}><button className="drawer-close" aria-label="Close shapes" onClick={onCloseShapes}>×</button><h3>Add service</h3><select aria-label="Cloud asset library" value={library} onChange={e => { setLibrary(e.target.value as AssetLibrary); setSearch(''); }}>{assetLibraries.map(id => <option key={id} value={id}>{libraryNames[id]}</option>)}</select>{!providers.includes(library as Provider) && <button onClick={() => onOpenInfrastructure(library)}>Open infrastructure diagram</button>}{inventorySources.filter(source => source.provider === library).map(source => <details key={source.provider}><summary>Service inventory source</summary><p className="hint">{source.scope}</p><a href={source.url} target="_blank" rel="noreferrer">Official source · {source.retrieved}</a></details>)}<input aria-label="Search services" placeholder="Search services…" value={search} onChange={e => setSearch(e.target.value)}/><p className="hint">Drag onto the canvas or click to add. Cloud libraries can be combined. {catalog.length} services; catalog additions are unpriced.</p>
                {categories.map(category => {
                    const items = catalog.filter(s => s.category === category);
                    return items.length ? <details key={category} open={category !== 'unsupported' || !!search}><summary>{category === 'unsupported' ? 'Additional services · unpriced' : category}</summary><div className="palette-grid">{items.map(s => <button key={s.id} className="palette-service" aria-label={`Add ${s.name}`} draggable onDragStart={e => { e.dataTransfer.setData('application/x-planner-service', s.id); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => addService(s.id)}><img src={assetUrl(s.icon)} alt=""/><span>{s.name}</span></button>)}</div></details> : null;
                })}
                {!providers.includes(library as Provider) && <div className="palette-grid">{drawingAssets.filter(a => a.library === library && a.label.toLowerCase().includes(search.toLowerCase())).map(asset => <button key={asset.id} className="palette-service" onClick={() => onOpenInfrastructure(library)} aria-label={`Use ${asset.label} in infrastructure diagram`}><img src={assetUrl(asset.icon)} alt=""/>{asset.label}</button>)}</div>}
                {!catalog.length && providers.includes(library as Provider) && <p role="status">No matching services.</p>}
            </aside>
            <div className="editor-canvas"><Diagram project={project} onChange={change} onSelect={select} selectedId={selected} onError={reportError} tool={tool} snap={snap} onAddService={addService}/><div className="canvas-status"><span>{v.resources.length} services · {v.connections.length} connections</span><span>Drag between node handles to connect</span></div></div>
            <aside className="properties-panel" aria-label="Selection properties" hidden={!selected}><button className="drawer-close" aria-label="Close properties" onClick={() => setSelected(undefined)}>×</button><h3>Properties</h3><Inspector project={project} selectedId={selected} onChange={p => run(() => change(p))} onSelect={select}/></aside>
        </div>
        <details className="connections" ref={connectionsRef}><summary>Resources & connections · {v.resources.length} services</summary><div className="resource-list">{v.resources.map(r => <button key={r.id} className={selected === r.id ? 'selected' : ''} onClick={() => select(r.id)}>{r.name}</button>)}{v.boundaries.map(b => <button key={b.id} onClick={() => select(b.id)}>{b.name}</button>)}</div>

            <div className="connection-builder"><select aria-label="Connection source" value={from} onChange={e => setFrom(e.target.value)}><option value="">From</option>{v.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select aria-label="Connection target" value={to} onChange={e => setTo(e.target.value)}><option value="">To</option>{v.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><input aria-label="Connection label" value={connectionLabel} onChange={e => setConnectionLabel(e.target.value)}/><button disabled={!from || !to} onClick={() => run(() => change(commit(project, d => { activeVariant(d).connections.push({ id: newId(), source: from, target: to, label: connectionLabel }); })))}>Connect</button></div>{v.connections.map(c => <button key={c.id} onClick={() => select(c.id)}>{v.resources.find(r => r.id === c.source)?.name} → {v.resources.find(r => r.id === c.target)?.name}: {c.label}</button>)}</details>
    </section>;
}
