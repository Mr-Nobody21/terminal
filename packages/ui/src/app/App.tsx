import { Notice } from '../shared/components/Notice';
import { ConfirmationProvider } from '../shared/components/Confirmation';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Chevron } from '../shared/components/Chevron';
import { sampleProject } from '@planner/domain/examples';
import { ThemeProvider, ThemeSelect } from '../shared/theme/Theme';
import { AccountPanel } from '../features/auth/AccountPanel';
import { AuthGate } from '../features/auth/AuthGate';
import { uploadImage,type Account } from '@planner/adapters/backend/client';
import { useEffect, useState, type CSSProperties } from 'react';
import { NavigationIcon } from '../shared/components/NavigationIcon';
import { useWorkspace } from './useWorkspace';
import { commit } from '@planner/domain/model';
import { ProjectStart } from '../features/projects/ProjectStart';
import { ProjectToolbar } from '../features/projects/ProjectToolbar';
import { RequirementsPanel } from '../features/requirements/RequirementsPanel';
import { ArchitecturePanel } from '../features/architecture/ArchitecturePanel';
import { CostPanel } from '../features/pricing/CostPanel';
import { FileTransfers } from '../features/exports/FileTransfers';
import { ExportButtons } from '../features/exports/ExportButtons';
import { AISettingsPanel } from '../features/ai/AIControls';
import { DrawingEditor } from '../features/drawings/DrawingEditor';
import { useDrawings } from '../features/drawings/useDrawings';
import { drawingKinds, drawingNames, parseDrawing, editDrawing, type DrawingKind } from '@planner/domain/drawings/model';
import { repository } from '@planner/adapters/storage/repository';
import { drawingRepository } from '@planner/adapters/storage/drawings';
import { exportDrawing, type DrawingExport } from '@planner/adapters/exports/drawings';
import { downloadArtifact } from '@planner/adapters/platform/download';
import { estimate } from '@planner/domain/pricing';
type Drawer = 'shapes' | 'requirements' | 'cost' | 'projects' | 'exports';
export function App(){return <ThemeProvider><ConfirmationProvider><AuthGate>{(account,logout)=><Workspace key={account.id} account={account} logout={logout}/>}</AuthGate></ConfirmationProvider></ThemeProvider>;}
function Workspace({account,logout}:{account:Account;logout:()=>Promise<void>}) {
    const [diagramType, setDiagramType] = useState<'architecture' | DrawingKind>('architecture');
    const controller = useWorkspace(diagramType === 'architecture');
    useEffect(() => { if(controller.project) setDiagramType(controller.project.costEnabled ? 'architecture' : 'infrastructure'); }, [controller.project?.id, controller.project?.costEnabled]);
    const drawingStore = useDrawings(controller.project?.id);
    const activeDrawing = drawingStore.drawings.find(d => d.kind === diagramType && d.projectId === controller.project?.id);
    useEffect(() => { if (diagramType !== 'architecture' && !activeDrawing && !drawingStore.loading) drawingStore.ensure(diagramType); }, [diagramType, activeDrawing, drawingStore]);
    const [drawer, setDrawer] = useState<Drawer>();
    const [loggingOut, setLoggingOut] = useState(false);
    const [noticeHeight,setNoticeHeight] = useState(0);
    const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem('planner-nav-expanded') === 'true'; } catch { return false; } });
    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !(event.target instanceof Element && event.target.closest('dialog'))) { setDrawer(undefined); controller.setSelected(undefined); }
        };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [controller.setSelected]);
    const { project, fullscreen, page, saveStatus, message, setMessage, ai } = controller;
    if (!project) return <main><h1>Cloud Architecture Planner</h1><p role="status">Loading your workspace…</p></main>;
    const workspace = { ...controller, project, switchProject: async (next: typeof project) => { await drawingStore.flush(); await controller.switchProject(next); }, flushCurrent: async () => { await drawingStore.flush(); await controller.flushCurrent(); } };
    const cost = project.costEnabled ? estimate(project) : undefined;
    const noticeMessage = message || (diagramType !== 'architecture' ? drawingStore.error : '');
    const signOut = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try { await workspace.flushCurrent(); await logout(); }
        catch (error) { setMessage(error instanceof Error ? error.message : 'Could not log out. Please try again.'); setLoggingOut(false); }
    };
    const openDashboard = async () => { try { if(!controller.needsProjectChoice) await workspace.flushCurrent(); await controller.refresh(); setDrawer(undefined); location.hash='dashboard'; } catch(error) { controller.reportError(error instanceof Error?error.message:'Could not open the dashboard.'); } };
    const toggle = (next: Drawer) => { setDrawer(current => current === next ? undefined : next); if (page !== 'workspace') location.hash = 'workspace'; };
    const expand = () => { setExpanded(!expanded); try { localStorage.setItem('planner-nav-expanded', String(!expanded)); } catch { /* Navigation remains usable without storage. */ } };
    return <main className={`zen-app${expanded ? ' nav-expanded' : ''}${fullscreen.fullscreen ? ' app-fullscreen' : ''}`} style={{'--notice-space':`${noticeHeight}px`} as CSSProperties}>
        {controller.needsProjectChoice&&<ProjectStart onChoose={enabled=>{controller.change(commit(project,d=>{d.costEnabled=enabled;if(!enabled){d.name='Untitled diagram';d.requirementsText='';d.requirements=[];d.sources=[];d.assumptions=[];d.variants[0].resources=[];d.variants[0].connections=[];d.variants[0].boundaries=[];d.presentation.positions={};}}));controller.setNeedsProjectChoice(false);setDiagramType(enabled?'architecture':'infrastructure');setDrawer(enabled?'cost':'shapes');location.hash='workspace';}}/>}
        <header className="zen-header"><a className="zen-brand" href="#dashboard" onClick={event=>{event.preventDefault();void openDashboard();}} aria-label="Cloud Architecture Planner"><span aria-hidden="true">◈</span></a><h1 className="sr-only">Cloud Architecture Planner</h1><button className="project-trigger" aria-expanded={drawer === 'projects'} onClick={() => page==='dashboard'?void openDashboard():toggle('projects')}><span className="project-name">{page==='dashboard'?'All projects':project.name}</span><Chevron/></button><span hidden={page==='dashboard'} className={saveStatus.startsWith('Save failed') ? 'save-error' : 'save-state'} role="status">{diagramType === 'architecture' ? saveStatus : drawingStore.status || 'Loading drawing…'}</span><div className="header-actions"><ThemeSelect/><button disabled={loggingOut} onClick={() => void signOut()}>{loggingOut ? 'Logging out…' : 'Log out'}</button><button className="account-trigger" aria-label="Account and projects" title={account.displayName} onClick={()=>toggle('projects')}><span className="account-icon"><NavigationIcon name="account"/></span><span className="account-name">{account.displayName}</span></button>{page==='workspace' && project.costEnabled && <button className="estimate-trigger" onClick={() => toggle('cost')} aria-label="Show monthly estimate">{diagramType === 'architecture' && cost ? <><span>${cost.base.toFixed(2)}</span><small>/mo · {cost.complete ? 'priced' : 'incomplete'}</small></> : 'Visual diagram'}</button>}<button className="fullscreen-control" disabled={fullscreen.busy} aria-label={fullscreen.fullscreen ? 'Exit full screen' : 'Enter full screen'} aria-pressed={fullscreen.fullscreen} onClick={() => void fullscreen.toggle()}>⛶</button><button hidden={page!=='workspace'} className="export-trigger" onClick={() => toggle('exports')} aria-expanded={drawer === 'exports'}>Export <Chevron/></button></div></header>
        <nav className="zen-nav" aria-label="Main navigation"><button className="nav-expand" aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={expanded} onClick={expand}><NavigationIcon name="menu"/><span className="nav-label">Navigation</span></button>
            <a href="#dashboard" aria-label="Dashboard" title="Dashboard" aria-current={page==='dashboard'?'page':undefined} onClick={event=>{event.preventDefault();void openDashboard();}}><NavigationIcon name="dashboard"/><span className="nav-label">Dashboard</span></a>
            {([['shapes', 'Shapes'], ['requirements', 'Requirements'], ['cost', 'Costs'], ['projects', 'Projects']] as const).filter(([id])=>project.costEnabled || id==='shapes' || id==='projects').map(([id, label]) => <button key={id} aria-label={label} title={expanded ? undefined : label} aria-expanded={page === 'workspace' && drawer === id} className={page === 'workspace' && drawer === id ? 'active' : ''} onClick={() => toggle(id)}><NavigationIcon name={id}/><span className="nav-label">{label}</span></button>)}
            <a href="#workspace" aria-label="Workspace" title="Workspace" onClick={() => setDrawer(undefined)}><NavigationIcon name="workspace"/><span className="nav-label">Workspace</span></a><a className="nav-settings" href="#settings" aria-label="AI settings" title="AI settings" aria-current={page === 'settings' ? 'page' : undefined}><NavigationIcon name="settings"/><span className="nav-label">AI settings</span></a>
        </nav>
        {page==='dashboard'&&<Dashboard account={account} projects={controller.projects} currentId={project.id} flush={workspace.flushCurrent} onManage={()=>toggle('projects')} onOpen={async next=>{await workspace.switchProject(next);controller.setNeedsProjectChoice(false);setDrawer(undefined);location.hash='workspace';}} onCreate={async(name,provider,cost)=>{const next=commit(sampleProject(provider),draft=>{draft.name=name;draft.costEnabled=cost;draft.requirementsText='';draft.requirements=[];draft.sources=[];draft.assumptions=[];draft.variants[0].resources=[];draft.variants[0].connections=[];draft.variants[0].boundaries=[];draft.presentation.positions={};});await workspace.switchProject(next);await repository.save(next);await controller.refresh();controller.setNeedsProjectChoice(false);setDiagramType(cost?'architecture':'infrastructure');setDrawer(undefined);location.hash='workspace';}}/>}
        {noticeMessage && <Notice message={noticeMessage} onDismiss={message?()=>setMessage(''):undefined} onSize={setNoticeHeight}/>}
        <div className="zen-settings" hidden={page !== 'settings'}><AISettingsPanel ai={ai}/></div>
        <div className="workspace zen-workspace" hidden={page !== 'workspace'}>
            <select className="diagram-type-picker" aria-label="Diagram type" value={diagramType} onChange={e => { setDiagramType(e.target.value as typeof diagramType); controller.setSelected(undefined); }}>{project.costEnabled&&<option value="architecture">Cloud architecture</option>}{drawingKinds.map(kind => <option key={kind} value={kind}>{drawingNames[kind]}</option>)}</select>
            <div className="architecture-surface" hidden={diagramType !== 'architecture'}><ArchitecturePanel active={page==='workspace'&&diagramType==='architecture'} onOpenInfrastructure={() => setDiagramType('infrastructure')} workspace={workspace} shapesOpen={drawer === 'shapes'} onCloseShapes={() => setDrawer(undefined)}/></div>
            {diagramType !== 'architecture' && (activeDrawing ? <DrawingEditor key={activeDrawing.id} drawing={activeDrawing} onChange={drawingStore.save} shapesOpen={drawer === 'shapes'} onCloseShapes={() => setDrawer(undefined)} onError={controller.reportError}/> : <p className="drawing-empty" role="status">Loading drawing…</p>)}
        </div>
        <div className="zen-drawer" hidden={page !== 'workspace' || !drawer || drawer === 'shapes'}>
            <button className="drawer-close" aria-label="Close panel" onClick={() => setDrawer(undefined)}>×</button>
            <div hidden={drawer !== 'projects'}><h2>Project settings</h2><button className="dashboard-link" onClick={()=>void openDashboard()}>View all projects</button><AccountPanel account={account} project={project} flush={workspace.flushCurrent} onLogout={logout} onError={setMessage} onLoad={async next=>{await repository.save(next);await workspace.switchProject(next);location.reload();}}/><ProjectToolbar workspace={workspace} onModeSelected={enabled=>{setDiagramType(enabled?'architecture':'infrastructure');setDrawer(enabled?'cost':'shapes');}}/></div>
            <div hidden={drawer !== 'requirements'}><RequirementsPanel architectureMode={diagramType === 'architecture'} workspace={workspace}/></div>
            <div hidden={drawer !== 'cost'}>{diagramType === 'architecture' && project.costEnabled ? <CostPanel workspace={workspace}/> : <><h2>No cloud estimate</h2><p>These are visual diagram shapes. Switch to Cloud architecture for deterministic cloud pricing.</p></>}</div>
            <div hidden={drawer !== 'exports'}><h2>{diagramType === 'architecture' ? 'Export architecture' : 'Export drawing'}</h2><p className="hint">{diagramType === 'architecture' ? 'Save a diagram, report or portable project.' : 'Drawing JSON is separate from cloud project JSON. SVG and Draw.io preserve this diagram.'}</p>{diagramType === 'architecture' ? <ExportButtons exporting={workspace.exporting} onExport={workspace.exportFile}/> : <><div className="export-grid">{(['json', 'svg', 'drawio'] as const).map(format => <button key={format} disabled={!activeDrawing} onClick={() => workspace.run(async () => { if (activeDrawing) await downloadArtifact(exportDrawing(activeDrawing, format as DrawingExport), `${project.name}-${diagramType}.${format}`); })}>Export {format.toUpperCase()}</button>)}</div><label className="drawing-import">Import drawing JSON<input aria-label="Import drawing JSON" type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) workspace.run(async () => { const text = await file.text(); parseDrawing(JSON.parse(text)); const next = await drawingRepository.import(text, project.id); drawingStore.save(next); setDiagramType(next.kind); }); }}/></label></>}<FileTransfers projectId={project.id} architecture={diagramType==='architecture'} data={diagramType==='architecture'?{project}:activeDrawing?{drawing:activeDrawing}:undefined} onError={controller.reportError} onImport={async data=>{
                if('project' in data){await workspace.flushCurrent();const imported=await repository.import(JSON.stringify(data.project));await controller.refresh();controller.open(imported);controller.setSelected(undefined);setMessage('Project imported and validated.');}
                else {const next=await drawingRepository.import(JSON.stringify(data.drawing),project.id);drawingStore.save(next);setDiagramType(next.kind);setMessage('Drawing imported and validated. Visual shapes do not carry cloud pricing.');}
            }} onImage={async image=>{await uploadImage(image.imageData,image.label);const kind=diagramType==='flowchart'?'flowchart':'infrastructure';const drawing=drawingStore.drawings.find(d=>d.kind===kind)??drawingStore.ensure(kind);if(!drawing)throw new Error('Drawing is still loading. Try again.');drawingStore.save(editDrawing(drawing,d=>{d.nodes.push({id:crypto.randomUUID(),shape:'image',fields:[],x:60,y:60,...image});}));setDiagramType(kind);setMessage('Reference image imported. Drag it on the canvas; select it to resize or delete.');}}/></div>
        </div>
    </main>;
}
