import type { LoadedWorkspace } from '../../app/useWorkspace';
import { commit, duplicateProject, importProject } from '@planner/domain/model';
import { sampleProject } from '@planner/domain/examples';
import { providers, providerName, regions, type Provider } from '@planner/domain/providers';
import { repository } from '@planner/adapters/storage/repository';
export function ProjectToolbar({ workspace }: {
    workspace: Pick<LoadedWorkspace, 'project' | 'projects' | 'provider' | 'setProvider' | 'run' | 'switchProject' | 'change' | 'saveTimer' | 'setProjects' | 'open' | 'setSelected' | 'importRef' | 'json' | 'flushCurrent' | 'refresh' | 'setMessage'>;
}) {
    const { project, projects, provider, setProvider, run, switchProject, change, saveTimer, setProjects, open, setSelected, importRef, json, flushCurrent, refresh, setMessage } = workspace;
    return <div className="project-bar"><label>Project<select aria-label="Project" value={projects.some(p => p.id === project.id) ? project.id : ''} onChange={e => {
            const p = projects.find(p => p.id === e.target.value);
            if (p) {
                run(() => switchProject(p));
            }
        }}>{!projects.some(p => p.id === project.id) && <option value="">{project.name}</option>}{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Name<input aria-label="Project name" value={project.name} onChange={e => {
            if (e.target.value)
                run(() => change(commit(project, d => { d.name = e.target.value; })));
        }}/></label><label>New example provider<select aria-label="Example provider" value={provider} onChange={e => setProvider(e.target.value as Provider)}>{providers.map(p => <option key={p} value={p}>{providerName[p]}</option>)}</select></label><label>Region<select aria-label="Example region" key={provider} defaultValue={regions[provider][0]}>{regions[provider].map(region => <option key={region}>{region}</option>)}</select></label><button onClick={() => run(() => switchProject(sampleProject(provider)))}>New example</button><button onClick={() => run(() => switchProject(duplicateProject(project)))}>Duplicate</button><button onClick={() => run(async () => {
            if (!confirm(`Delete “${project.name}” from this device?`))
                return;
            clearTimeout(saveTimer.current);
            await repository.remove(project.id);
            const list = await repository.list();
            setProjects(list);
            open(list[0] ?? sampleProject(provider));
            setSelected(undefined);
        })}>Delete project</button><button onClick={() => importRef.current?.click()}>Import JSON</button><button onClick={json}>Download JSON</button><input ref={importRef} aria-label="Import project JSON" className="file-input" type="file" accept=".json,application/json" onChange={e => {
            const file = e.target.files?.[0];
            if (file)
                run(async () => { const text = await file.text(); importProject(text); await flushCurrent(); const imported = await repository.import(text); await refresh(); open(imported); setSelected(undefined); setMessage('Project imported and validated.'); });
            e.target.value = '';
        }}/></div>;
}
