import { useConfirmation } from '../../shared/components/Confirmation';
import { useState } from 'react';
import { ProjectStart } from './ProjectStart';
import type { LoadedWorkspace } from '../../app/useWorkspace';
import { commit, duplicateProject, importProject } from '@planner/domain/model';
import { sampleProject } from '@planner/domain/examples';
import { providers, providerName, regions, type Provider } from '@planner/domain/providers';
import { drawingRepository } from '@planner/adapters/storage/drawings';
import { repository } from '@planner/adapters/storage/repository';
export function ProjectToolbar({ workspace, onModeSelected }: {
    onModeSelected: (enabled: boolean) => void;
    workspace: Pick<LoadedWorkspace, 'project' | 'projects' | 'provider' | 'setProvider' | 'run' | 'switchProject' | 'change' | 'saveTimer' | 'setProjects' | 'open' | 'setSelected' | 'importRef' | 'json' | 'flushCurrent' | 'refresh' | 'setMessage'>;
}) {
    const confirm = useConfirmation();
    const { project, projects, provider, setProvider, run, switchProject, change, saveTimer, setProjects, open, setSelected, importRef, json, flushCurrent, refresh, setMessage } = workspace;
    const [pending,setPending]=useState<'blank'|'example'>();
    const [creating,setCreating]=useState(false),[creationError,setCreationError]=useState('');
    const create=(enabled:boolean)=>run(async()=>{
        setCreating(true);setCreationError('');try{
        const next=commit(sampleProject(provider),draft=>{draft.costEnabled=enabled;if(pending==='blank'){draft.name=enabled?'Untitled cost project':'Untitled diagram';draft.requirementsText='';draft.requirements=[];draft.sources=[];draft.assumptions=[];draft.variants[0].resources=[];draft.variants[0].connections=[];draft.variants[0].boundaries=[];}});
        await switchProject(next);setPending(undefined);onModeSelected(enabled);
        }catch(error){setCreationError(error instanceof Error?error.message:'Project creation failed');throw error;}finally{setCreating(false);}
    });
    return <div className="project-bar"><button onClick={()=>setPending('blank')}>New project</button>{pending&&<ProjectStart onChoose={create} onCancel={()=>setPending(undefined)} busy={creating} error={creationError}/>}<label><input aria-label="Enable cost calculations" type="checkbox" checked={project.costEnabled} onChange={e=>{const enabled=e.target.checked;run(()=>change(commit(project,d=>{d.costEnabled=enabled;})));onModeSelected(enabled);}}/>Cost calculations</label><label>Project<select aria-label="Project" value={projects.some(p => p.id === project.id) ? project.id : ''} onChange={e => {
            const p = projects.find(p => p.id === e.target.value);
            if (p) {
                run(() => switchProject(p));
            }
        }}>{!projects.some(p => p.id === project.id) && <option value="">{project.name}</option>}{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Name<input aria-label="Project name" value={project.name} onChange={e => {
            if (e.target.value)
                run(() => change(commit(project, d => { d.name = e.target.value; })));
        }}/></label><label>New example provider<select aria-label="Example provider" value={provider} onChange={e => setProvider(e.target.value as Provider)}>{providers.map(p => <option key={p} value={p}>{providerName[p]}</option>)}</select></label><label>Region<select aria-label="Example region" key={provider} defaultValue={regions[provider][0]}>{regions[provider].map(region => <option key={region}>{region}</option>)}</select></label><button onClick={() => setPending('example')}>New example</button><button onClick={() => run(async () => { await flushCurrent(); const copy = duplicateProject(project); await drawingRepository.duplicateProject(project.id, copy.id); await switchProject(copy); })}>Duplicate</button><button onClick={() => run(async () => {
            if (!await confirm(`Delete “${project.name}” from this device?`,{title:'Delete device project?',confirmLabel:'Delete project',danger:true}))
                return;
            await flushCurrent();
            clearTimeout(saveTimer.current);
            await drawingRepository.removeProject(project.id);
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
