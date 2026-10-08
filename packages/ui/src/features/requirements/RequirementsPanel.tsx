import type { LoadedWorkspace } from '../../app/useWorkspace';
import { commit, newId } from '@planner/domain/model';
import { providerName } from '@planner/domain/providers';
import { CollapsiblePanel } from '../../shared/components/CollapsiblePanel';
import { AIRequirementsControls } from '../ai/AIControls';
export function RequirementsPanel({ workspace, architectureMode = true }: {
    architectureMode?: boolean;
    workspace: Pick<LoadedWorkspace, 'project' | 'requirementsCollapsed' | 'setRequirementsCollapsed' | 'change' | 'ai' | 'run'>;
}) {
    const { project, requirementsCollapsed, setRequirementsCollapsed, change, ai, run } = workspace;
    return <CollapsiblePanel className="requirements-panel" step="01" title="Requirements" collapsed={requirementsCollapsed} onToggle={() => setRequirementsCollapsed(value => !value)}><p className="hint">Describe your product, or paste a PRD. Projects and edits stay on this device.</p><label>Product requirements<textarea aria-label="Requirements" value={project.requirementsText} onChange={e => change(commit(project, d => { d.requirementsText = e.target.value; }))}/></label><div className="provider-badge">{providerName[project.provider]} · {project.region}</div>{architectureMode ? <AIRequirementsControls ai={ai} project={project}/> : <p className="hint">These are shared project requirements. Switch to Cloud architecture for AI generation.</p>}<h3>Facts & questions</h3>{project.requirements.map(r => <label key={r.id} className="requirement"><span>{r.text}{r.critical && <small> · critical</small>}</span><small>{project.sources.find(s => s.id === r.sourceId)?.kind ?? 'user'} · {r.status}</small>{r.status === 'unknown' && <><input aria-label={`Answer: ${r.text}`} placeholder="Answer this question" value={r.answer ?? ''} onChange={e => change(commit(project, d => { d.requirements.find(x => x.id === r.id)!.answer = e.target.value; }))}/><button disabled={!r.answer?.trim()} onClick={() => run(() => change(commit(project, d => { const a = { id: newId(), label: r.text, value: r.answer!.trim(), unit: 'text', source: 'user' as const, critical: r.critical }; d.assumptions.push(a); d.requirements.find(x => x.id === r.id)!.assumptionId = a.id; })))}>Use explicit assumption</button></>}</label>)}<h3>Assumptions</h3>{project.assumptions.map(a => <label key={a.id} className="assumption"><span>{a.label}</span><small>{a.source} · {a.unit}</small><input aria-label={`Assumption: ${a.label}`} value={a.value} onChange={e => change(commit(project, d => {
                const edited = d.assumptions.find(x => x.id === a.id)!;
                edited.value = e.target.value;
                const num = Number(e.target.value);
                d.variants.forEach(v => v.resources.forEach(r => Object.entries(r.configuration.inputs).forEach(([k, i]) => {
                    if (i.source.kind === 'assumption' && i.source.id === a.id) {
                        if (e.target.value.trim() && Number.isFinite(num) && num >= 0)
                            i.value = num;
                        else
                            delete r.configuration.inputs[k];
                    }
                })));
            }))}/></label>)}<button onClick={() => change(commit(project, d => { d.assumptions.push({ id: newId(), label: 'New assumption', value: 'Describe your assumption', unit: 'text', source: 'user', critical: false }); }))}>Add assumption</button></CollapsiblePanel>;
}
