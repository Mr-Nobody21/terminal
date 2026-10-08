import { useConfirmation } from '../../shared/components/Confirmation';
import { useEffect, useState } from 'react';
import type { Project } from '@planner/domain/model';
import { parseProject } from '@planner/domain/model';
import { parseDrawing } from '@planner/domain/drawings/model';
import { providers, providerName, type Provider } from '@planner/domain/providers';
import { api, type Account } from '@planner/adapters/backend/client';
import { repository } from '@planner/adapters/storage/repository';
import { drawingRepository } from '@planner/adapters/storage/drawings';
import { ProjectStart } from '../projects/ProjectStart';
interface AccountProject { id:string; name:string; revision:number }
export function Dashboard({account,projects,currentId,onOpen,onCreate,flush,onManage}:{account:Account;projects:Project[];currentId:string;onOpen:(project:Project)=>Promise<void>;onCreate:(name:string,provider:Provider,cost:boolean)=>Promise<void>;flush:()=>Promise<void>;onManage:()=>void}) {
 const confirm=useConfirmation();
 const [query,setQuery]=useState(''),[creating,setCreating]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [name,setName]=useState(''),[provider,setProvider]=useState<Provider>('aws');
 const [remote,setRemote]=useState<AccountProject[]>([]),[remoteError,setRemoteError]=useState(''),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);setRemoteError('');try{setRemote((await api<{projects:AccountProject[]}>('/projects')).projects);}catch(error){setRemoteError(error instanceof Error?error.message:'Could not load account projects.');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setError('');try{await action();}catch(error){setError(error instanceof Error?error.message:'Could not open this project.');}finally{setBusy(false);}};
 const matches=(label:string)=>label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
 const local=projects.filter(project=>matches(project.name));
 const accountProjects=remote.filter(project=>matches(project.name));
 const openAccount=async(item:AccountProject)=>{
  await flush();
  const result=await api<{document:unknown;drawings:unknown[];revision:number}>(`/projects/${item.id}`);
  const project=parseProject(result.document),drawings=result.drawings.map(parseDrawing);
  if(project.id!==item.id||drawings.some(drawing=>drawing.projectId!==project.id))throw new Error('Invalid account project ownership.');
  if(await repository.load(project.id)&&!await confirm('Open the account snapshot? This replaces the device copy of this project.',{title:'Open account snapshot?',confirmLabel:'Open snapshot'}))return;
  await drawingRepository.transaction('rw',drawingRepository.drawings,async()=>{await drawingRepository.removeProject(project.id);for(const drawing of drawings)await drawingRepository.save(drawing);});
  await repository.save(project);
  const key='planner-account-revisions:'+account.id;
  try{const previous=JSON.parse(sessionStorage.getItem(key)??'{}');sessionStorage.setItem(key,JSON.stringify({...previous,[project.id]:result.revision}));}catch{/* Missing revisions fail safely on the next server write. */}
  await onOpen(project);
 };
 return <section className="dashboard" aria-labelledby="dashboard-title">
  <div className="dashboard-heading"><div><p className="mode-eyebrow">Your workspace</p><h2 id="dashboard-title">Projects</h2><p>Pick up where you left off, or start with a clean canvas.</p></div><button className="primary" onClick={()=>{setName('');setCreating(true);setError('');}}>New project</button></div>
  <div className="dashboard-search"><label htmlFor="project-search">Find a project</label><input id="project-search" type="search" placeholder="Search by project name" value={query} onChange={event=>setQuery(event.target.value)}/><button onClick={onManage}>Account & project settings</button></div>
  {error&&!creating&&<p className="notice" role="alert">{error}</p>}
  <section className="dashboard-section" aria-labelledby="device-projects-title"><div className="dashboard-section-heading"><h3 id="device-projects-title">On this device</h3><span>{local.length} projects</span></div><p className="hint">Your local saves, ready to edit.</p>
   <div className="project-grid">{local.map(project=><article className="project-card" key={project.id}><div className="project-card-meta"><span>{project.costEnabled?'Cost planning':'Simple diagram'}</span>{project.id===currentId&&<span>Current</span>}</div><h4>{project.name}</h4><p>{providerName[project.provider]} · {new Date(project.updatedAt).toLocaleDateString()}</p><button disabled={busy} aria-label={`Open ${project.name}`} onClick={()=>void run(()=>onOpen(project))}>Open project <span aria-hidden="true">→</span></button></article>)}</div>
   {!local.length&&<div className="dashboard-empty"><h4>{query?'No matching device projects':'Your next idea starts here'}</h4><p>{query?'Try another project name.':'Create a project to start a diagram or plan cloud costs.'}</p></div>}
  </section>
  <section className="dashboard-section" aria-labelledby="account-projects-title"><div className="dashboard-section-heading"><h3 id="account-projects-title">Saved to your account</h3><button disabled={loading||busy} onClick={()=>void load()}>{loading?'Loading…':'Refresh account projects'}</button></div><p className="hint">Snapshots saved to your account. Device changes are saved separately.</p>
   {remoteError?<p role="alert">{remoteError} Your device projects are still available.</p>:<><div className="project-grid">{accountProjects.map(project=><article className="project-card" key={project.id}><div className="project-card-meta"><span>Account snapshot</span><span>Revision {project.revision}</span></div><h4>{project.name}</h4><button disabled={busy} aria-label={`Open account project ${project.name}`} onClick={()=>void run(()=>openAccount(project))}>Open snapshot <span aria-hidden="true">→</span></button></article>)}</div>{!loading&&!accountProjects.length&&<p className="dashboard-empty">{query?'No matching account projects.':'No account snapshots yet. Use Save to account in project settings when you’re ready.'}</p>}</>}
  </section>
  {creating&&<ProjectStart busy={busy} error={error} onCancel={()=>setCreating(false)} onChoose={cost=>void run(async()=>{await onCreate(name.trim()||(cost?'Untitled cost project':'Untitled diagram'),provider,cost);setCreating(false);})}><div className="project-create-fields"><label>Project name<input aria-label="New project name" maxLength={120} placeholder="Untitled project" value={name} onChange={event=>setName(event.target.value)}/></label><label>Cloud provider<select aria-label="New project provider" value={provider} onChange={event=>setProvider(event.target.value as Provider)}>{providers.map(value=><option value={value} key={value}>{providerName[value]}</option>)}</select></label></div></ProjectStart>}
 </section>;
}
