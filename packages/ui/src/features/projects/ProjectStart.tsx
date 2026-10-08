import { useEffect, useRef } from 'react';
export function ProjectStart({onChoose}:{onChoose:(enabled:boolean)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} className="project-mode-dialog" aria-labelledby="first-project-title" onCancel={e=>e.preventDefault()}><h2 id="first-project-title">Include cost calculations?</h2><p>Plan cloud infrastructure with cost estimates, or start with a simple diagram. You can change this later in Projects.</p><button autoFocus onClick={()=>onChoose(true)}>Plan with costs</button><button onClick={()=>onChoose(false)}>Simple diagram</button></dialog>;
}
