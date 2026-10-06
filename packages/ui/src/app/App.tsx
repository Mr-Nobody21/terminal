import { useWorkspace } from './useWorkspace';
import { ProjectToolbar } from '../features/projects/ProjectToolbar';
import { RequirementsPanel } from '../features/requirements/RequirementsPanel';
import { ArchitecturePanel } from '../features/architecture/ArchitecturePanel';
import { CostPanel } from '../features/pricing/CostPanel';
import { AISettingsPanel } from '../features/ai/AIControls';
export function App() {
    const controller = useWorkspace();
    const { project, fullscreen, page, saveStatus, message, setMessage, requirementsCollapsed, costCollapsed, ai } = controller;
    if (!project)
        return <main><h1>Cloud Architecture Planner</h1><p role="status">Loading your workspace…</p></main>;
    const workspace = { ...controller, project };
    return <main className={fullscreen.fullscreen ? 'app-fullscreen' : undefined}><header className="app-header"><a className="brand" href="#workspace"><span className="brand-icon">◈</span><div><h1>Cloud Architecture Planner</h1><small>Design locally. Estimate deterministically.</small></div></a><nav><button type="button" disabled={fullscreen.busy} aria-label={fullscreen.fullscreen ? 'Exit full screen' : 'Enter full screen'} aria-pressed={fullscreen.fullscreen} onClick={() => void fullscreen.toggle()}>{fullscreen.fullscreen ? 'Exit full screen' : 'Full screen'}</button><a href="#workspace" aria-current={page === 'workspace' ? 'page' : undefined}>Workspace</a><a href="#settings" aria-current={page === 'settings' ? 'page' : undefined}>AI settings</a><span className={saveStatus.startsWith('Save failed') ? 'save-error' : 'save-state'} role="status">{saveStatus}</span></nav></header>
 {message && <div className="notice" role="alert">{message}<button aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div>}
 <ProjectToolbar workspace={workspace}/>
 {page === 'settings' ? <AISettingsPanel ai={ai}/> : <>
 <div className={`workspace${requirementsCollapsed ? ' requirements-collapsed' : ''}${costCollapsed ? ' cost-collapsed' : ''}`}>
 <RequirementsPanel workspace={workspace}/>
 <ArchitecturePanel workspace={workspace}/>
 <CostPanel workspace={workspace}/>
 </div><footer>Local-first · No account required · No application backend</footer></>}
 </main>;
}
