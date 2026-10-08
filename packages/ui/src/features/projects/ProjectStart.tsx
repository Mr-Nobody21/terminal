import { useEffect, useRef, type ReactNode } from 'react';
export function ProjectStart({onChoose,onCancel,busy=false,error,children}:{onChoose:(enabled:boolean)=>void;onCancel?:()=>void;busy?:boolean;error?:string;children?:ReactNode}){
 const dialog=useRef<HTMLDialogElement>(null),title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{dialog.current?.showModal();title.current?.focus();},[]);
 return <dialog ref={dialog} className="project-mode-dialog" aria-labelledby="first-project-title" aria-describedby="first-project-description" onKeyDown={event=>{if(event.key==='Escape')event.stopPropagation();}} onCancel={event=>{event.preventDefault();if(!busy)onCancel?.();}}>
  <p className="mode-eyebrow">A new workspace</p><h2 id="first-project-title" ref={title} tabIndex={-1}>Include cost calculations?</h2>
  <p id="first-project-description">Choose how you want to start. You can change this later in Projects.</p>
  {children}{error&&<p role="alert">{error}</p>}<div className="project-mode-options"><button className="project-mode-option" disabled={busy} aria-label="Plan with costs" onClick={()=>onChoose(true)}><span className="mode-icon" aria-hidden="true">$</span><strong>Plan with costs</strong><span>Design cloud infrastructure with live estimates and workload assumptions.</span></button><button className="project-mode-option" disabled={busy} aria-label="Simple diagram" onClick={()=>onChoose(false)}><span className="mode-icon" aria-hidden="true">◇</span><strong>Simple diagram</strong><span>Start with a clear canvas for diagrams, shapes and connections.</span></button></div>
 {onCancel&&<button className="project-mode-cancel" disabled={busy} onClick={onCancel}>Cancel</button>}
 </dialog>;
}
