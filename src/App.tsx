import { useCallback, useEffect, useRef, useState } from 'react';
import { activeVariant, commit, duplicateProject, newId, importProject, serializeProject, type Project } from './core/model';
import { sampleProject, makeResource } from './core/sample';
import { providers, providerName, services, regions, type Provider } from './core/providers';
import { useHistory } from './core/history';
import { repository } from './storage/repository';
import { Diagram } from './features/diagram/Diagram';
import { Inspector } from './features/architecture/Inspector';
import { useAI, AISettingsPanel, AIRequirementsControls } from './features/ai/AIControls';
import { estimate } from './features/pricing';
import type { ExportFormat } from './features/export/artifacts';
export function App() {
    const { project, past, future, open, apply, undo, redo } = useHistory();
    const [projects, setProjects] = useState<Project[]>([]), [selected, setSelected] = useState<string>(), [message, setMessage] = useState(''), [saveStatus, setSaveStatus] = useState('Loading local projects…'), [page, setPage] = useState(location.hash === '#settings' ? 'settings' : 'workspace');
    const [exporting, setExporting] = useState('');
    const [service, setService] = useState(''), [provider, setProvider] = useState<Provider>('aws'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [connectionLabel, setConnectionLabel] = useState('HTTPS');
    const saveTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
    const lastSaved = useRef(''), importRef = useRef<HTMLInputElement>(null);
    const ai = useAI(project, apply, (text) => setMessage(text));
    const reportError = useCallback((message: string) => setMessage(message), []);
    const refresh = useCallback(async () => setProjects(await repository.list()), []);
    useEffect(() => { let cancelled = false; repository.list().then(list => { if (cancelled)
        return; setProjects(list); open(list[0] ?? sampleProject()); }).catch(() => { if (!cancelled) {
        open(sampleProject());
        setMessage('Local storage is unavailable. Keep your work by downloading project JSON.');
    } }); const route = () => setPage(location.hash === '#settings' ? 'settings' : 'workspace'); window.addEventListener('hashchange', route); return () => { cancelled = true; window.removeEventListener('hashchange', route); }; }, [open]);
    useEffect(() => { if (!project)
        return; const text = serializeProject(project); if (text === lastSaved.current)
        return; setSaveStatus('Unsaved changes'); let cancelled = false; const timer = setTimeout(() => { repository.save(project).then(async () => { if (cancelled)
        return; lastSaved.current = text; setSaveStatus('Saved on this device'); await refresh(); }).catch(() => { if (!cancelled) {
        setSaveStatus('Save failed — download JSON');
        setMessage('Autosave failed. Your current project is still in memory. Download JSON to preserve it.');
    } }); }, 350); saveTimer.current=timer; return () => { cancelled = true; clearTimeout(timer); }; }, [project, refresh]);
    const change = useCallback((p: Project) => { try {
        apply(p);
        setMessage('');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Invalid edit');
    } }, [apply]);
    useEffect(() => { const key = (e: KeyboardEvent) => { const target = e.target as HTMLElement; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
        return; if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey)
            redo();
        else
            undo();
    } if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [undo, redo]);
    const download = (blob: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    const json = () => { if (project)
        download(new Blob([serializeProject(project)], { type: 'application/json' }), `${project.name}.json`); };
    const run = (action: () => void | Promise<void>) => { try {
        Promise.resolve(action()).catch(e => reportError(e instanceof Error ? e.message : 'Operation failed'));
    }
    catch (e) {
        reportError(e instanceof Error ? e.message : 'Operation failed');
    } };
    if (!project)
        return <main><h1>Cloud Architecture Planner</h1><p role="status">Loading your workspace…</p></main>;
    const flushCurrent=async()=>{const snapshot=project;clearTimeout(saveTimer.current);try{await repository.save(snapshot);}catch{throw new Error('Could not save the current project. It remains in memory; download JSON before switching projects.');}if(useHistory.getState().project!==snapshot)throw new Error('The project changed while saving. Please select again.');lastSaved.current=serializeProject(snapshot);};
    const switchProject=async(next:Project)=>{await flushCurrent();open(next);setSelected(undefined);await refresh();};
    const v = activeVariant(project), cost = estimate(project);
    const exportFile = async (format: ExportFormat) => { setExporting(format); try {
        const { exportArtifact } = await import('./features/export/artifacts');
        download(await exportArtifact(project, format), `${project.name}.${format}`);
    }
    catch (e) {
        reportError(e instanceof Error ? e.message : 'Export failed');
    }
    finally {
        setExporting('');
    } };
    return <main><header className="app-header"><a className="brand" href="#workspace"><span className="brand-icon">◈</span><div><h1>Cloud Architecture Planner</h1><small>Design locally. Estimate deterministically.</small></div></a><nav><a href="#workspace" aria-current={page === 'workspace' ? 'page' : undefined}>Workspace</a><a href="#settings" aria-current={page === 'settings' ? 'page' : undefined}>AI settings</a><span className={saveStatus.startsWith('Save failed') ? 'save-error' : 'save-state'} role="status">{saveStatus}</span></nav></header>
 {message && <div className="notice" role="alert">{message}<button aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div>}
 <div className="project-bar"><label>Project<select aria-label="Project" value={projects.some(p => p.id === project.id) ? project.id : ''} onChange={e => { const p = projects.find(p => p.id === e.target.value); if (p) {
        run(()=>switchProject(p));
    } }}>{!projects.some(p => p.id === project.id) && <option value="">{project.name}</option>}{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Name<input aria-label="Project name" value={project.name} onChange={e => { if (e.target.value)
        run(() => change(commit(project, d => { d.name = e.target.value; }))); }}/></label><label>New example provider<select aria-label="Example provider" value={provider} onChange={e => setProvider(e.target.value as Provider)}>{providers.map(p => <option key={p} value={p}>{providerName[p]}</option>)}</select></label><label>Region<select aria-label="Example region" key={provider} defaultValue={regions[provider][0]}>{regions[provider].map(region => <option key={region}>{region}</option>)}</select></label><button onClick={() => run(()=>switchProject(sampleProject(provider)))}>New example</button><button onClick={() => run(()=>switchProject(duplicateProject(project)))}>Duplicate</button><button onClick={() => run(async () => { if (!confirm(`Delete “${project.name}” from this device?`))
        return; clearTimeout(saveTimer.current);await repository.remove(project.id); const list = await repository.list(); setProjects(list); open(list[0] ?? sampleProject(provider)); setSelected(undefined); })}>Delete project</button><button onClick={() => importRef.current?.click()}>Import JSON</button><button onClick={json}>Download JSON</button><input ref={importRef} aria-label="Import project JSON" className="file-input" type="file" accept=".json,application/json" onChange={e => { const file = e.target.files?.[0]; if (file)
        run(async () => { const text=await file.text();importProject(text);await flushCurrent();const imported = await repository.import(text); await refresh(); open(imported); setSelected(undefined); setMessage('Project imported and validated.'); }); e.target.value = ''; }}/></div>
 {page === 'settings' ? <AISettingsPanel ai={ai}/> : <>
 <div className="workspace"><aside className="requirements-panel"><div className="panel-title"><span className="step">01</span><h2>Requirements</h2></div><p className="hint">Describe your product, or paste a PRD. Projects and edits stay on this device.</p><label>Product requirements<textarea aria-label="Requirements" value={project.requirementsText} onChange={e => change(commit(project, d => { d.requirementsText = e.target.value; }))}/></label><div className="provider-badge">{providerName[project.provider]} · {project.region}</div><AIRequirementsControls ai={ai} project={project}/><h3>Facts & questions</h3>{project.requirements.map(r => <label key={r.id} className="requirement"><span>{r.text}{r.critical && <small> · critical</small>}</span><small>{project.sources.find(s => s.id === r.sourceId)?.kind ?? 'user'} · {r.status}</small>{r.status === 'unknown' && <><input aria-label={`Answer: ${r.text}`} placeholder="Answer this question" value={r.answer ?? ''} onChange={e => change(commit(project, d => { d.requirements.find(x => x.id === r.id)!.answer = e.target.value; }))}/><button disabled={!r.answer?.trim()} onClick={() => run(() => change(commit(project, d => { const a = { id: newId(), label: r.text, value: r.answer!.trim(), unit: 'text', source: 'user' as const, critical: r.critical }; d.assumptions.push(a); d.requirements.find(x => x.id === r.id)!.assumptionId = a.id; })))}>Use explicit assumption</button></>}</label>)}<h3>Assumptions</h3>{project.assumptions.map(a => <label key={a.id} className="assumption"><span>{a.label}</span><small>{a.source} · {a.unit}</small><input aria-label={`Assumption: ${a.label}`} value={a.value} onChange={e => change(commit(project, d => { const edited = d.assumptions.find(x => x.id === a.id)!; edited.value = e.target.value; const num = Number(e.target.value); d.variants.forEach(v => v.resources.forEach(r => Object.entries(r.configuration.inputs).forEach(([k, i]) => { if (i.source.kind === 'assumption' && i.source.id === a.id) {
            if (e.target.value.trim() && Number.isFinite(num) && num >= 0)
                i.value = num;
            else
                delete r.configuration.inputs[k];
        } }))); }))}/></label>)}<button onClick={() => change(commit(project, d => { d.assumptions.push({ id: newId(), label: 'New assumption', value: 'Describe your assumption', unit: 'text', source: 'user', critical: false }); }))}>Add assumption</button></aside>
 <section className="canvas-panel"><div className="panel-title"><span className="step">02</span><h2>Architecture</h2><select aria-label="Architecture variant" value={project.activeVariantId} onChange={e => { change(commit(project, d => { d.activeVariantId = e.target.value; })); setSelected(undefined); }}>{project.variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div><div className="canvas-toolbar"><button disabled={!past.length} onClick={undo}>Undo</button><button disabled={!future.length} onClick={redo}>Redo</button><button onClick={() => change(commit(project, d => { d.presentation.positions = {}; }))}>Auto layout</button><select aria-label="Service to add" value={service} onChange={e => setService(e.target.value)}><option value="">Choose service</option>{services.filter(s => s.provider === project.provider).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={!service} onClick={() => run(() => { const r = makeResource(project, service); change(commit(project, d => { activeVariant(d).resources.push(r); })); setSelected(r.id); })}>Add service</button><button onClick={() => run(() => change(commit(project, d => { activeVariant(d).boundaries.push({ id: newId(), name: 'Network boundary', kind: 'network' }); })))}>Add boundary</button></div><Diagram project={project} onChange={change} onSelect={setSelected} selectedId={selected} onError={reportError}/><details className="connections"><summary>Resources & connections · {v.resources.length} services</summary><div className="resource-list">{v.resources.map(r => <button key={r.id} className={selected === r.id ? 'selected' : ''} onClick={() => setSelected(r.id)}>{r.name}</button>)}{v.boundaries.map(b => <button key={b.id} onClick={() => setSelected(b.id)}>{b.name}</button>)}</div><div className="connection-builder"><select aria-label="Connection source" value={from} onChange={e => setFrom(e.target.value)}><option value="">From</option>{v.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select aria-label="Connection target" value={to} onChange={e => setTo(e.target.value)}><option value="">To</option>{v.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><input aria-label="Connection label" value={connectionLabel} onChange={e => setConnectionLabel(e.target.value)}/><button disabled={!from || !to} onClick={() => run(() => change(commit(project, d => { activeVariant(d).connections.push({ id: newId(), source: from, target: to, label: connectionLabel }); })))}>Connect</button></div>{v.connections.map(c => <button key={c.id} onClick={() => setSelected(c.id)}>{v.resources.find(r => r.id === c.source)?.name} → {v.resources.find(r => r.id === c.target)?.name}: {c.label}</button>)}</details><Inspector project={project} selectedId={selected} onChange={p => run(() => change(p))} onSelect={setSelected}/></section>
 <aside className="cost-panel"><div className="panel-title"><span className="step">03</span><h2>Monthly estimate</h2></div><div className="cost-total"><small>Known base subtotal · USD</small><strong data-testid="cost-total">${cost.base.toFixed(2)}</strong><span>per month</span></div><p className={cost.complete ? 'complete' : 'incomplete'}>{!v.resources.length?'Add a service to begin estimating':cost.complete ? 'All resource rates priced' : 'Incomplete estimate — unpriced costs remain'}</p><div className="cost-range"><span>Low<strong>${cost.low.toFixed(2)}</strong></span><span>High<strong>${cost.high.toFixed(2)}</strong></span></div><h3>Resource breakdown</h3>{cost.resources.map(r => <details key={r.resourceId}><summary>{r.name}<strong>{!r.complete&&!r.lineItems.length?'Unpriced':`$${r.base.toFixed(2)}${r.complete?'':' + ?'}`}</strong></summary>{r.lineItems.map((line,index)=><div className="price-detail" key={index}><p>{line.formula}</p><p>SKU: {line.rate.sku} · {line.rate.units}</p>{Object.entries(line.inputs).map(([name,input])=><p key={name}>{name}: {input.value} {input.unit} · {input.source.kind==='catalog'?'documented default':project.assumptions.find(a=>a.id===input.source.id)?.label??project.requirements.find(r=>r.id===input.source.id)?.text??'input source'}</p>)}<a href={line.rate.source} target="_blank" rel="noreferrer">Rate source · retrieved {line.rate.retrieved}</a></div>)}{r.warnings.map((w, i) => <p className="hint" key={i}>{w}</p>)}</details>)}<h3>Category totals</h3>{Object.entries(cost.categories).map(([name,total])=><p className="total-row" key={name}><span>{name}</span><strong>${total.base.toFixed(2)}{total.complete?'':' + ?'}</strong></p>)}<h3>Environment totals</h3>{Object.entries(cost.environments).map(([name,total])=><p className="total-row" key={name}><span>{name}</span><strong>${total.base.toFixed(2)}{total.complete?'':' + ?'}</strong></p>)}<details><summary>Assumptions & completeness warnings</summary>{cost.warnings.map((w, i) => <p className="hint" key={i}>{w}</p>)}</details><details><summary>Pricing sources</summary>{cost.sources.map(source=><p className="hint" key={source}><a href={source} target="_blank" rel="noreferrer">{new URL(source).hostname}</a></p>)}</details><p className="hint">730-hour month. Taxes, discounts, credits and free tiers excluded. Equal range bounds mean no variability was supplied.</p><h3>Exports</h3><div className="export-grid">{(['drawio', 'json', 'svg', 'png', 'pdf', 'md', 'docx', 'zip'] as const).map(format => <button disabled={!!exporting} key={format} onClick={() => void exportFile(format)}>{exporting === format ? 'Preparing…' : `Export ${format.toUpperCase()}`}</button>)}</div></aside></div><footer>Local-first · No account required · No application backend</footer></>}
 </main>;
}
