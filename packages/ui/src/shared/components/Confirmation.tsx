import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
interface Options {title?:string;confirmLabel?:string;danger?:boolean}
type Confirm=(message:string,options?:Options)=>Promise<boolean>;
const ConfirmationContext=createContext<Confirm|undefined>(undefined);
export function ConfirmationProvider({children}:{children:ReactNode}){
 const [pending,setPending]=useState<{message:string;options:Options}>();
 const resolve=useRef<((answer:boolean)=>void)|undefined>(undefined);
 const finish=(answer:boolean)=>{resolve.current?.(answer);resolve.current=undefined;setPending(undefined);};
 useEffect(()=>()=>{resolve.current?.(false);},[]);
 const confirm:Confirm=(message,options={})=>{if(resolve.current)return Promise.resolve(false);return new Promise<boolean>(answer=>{resolve.current=answer;setPending({message,options});});};
 return <ConfirmationContext.Provider value={confirm}>{children}{pending&&<ConfirmationDialog message={pending.message} options={pending.options} onAnswer={finish}/>}</ConfirmationContext.Provider>;
}
function ConfirmationDialog({message,options,onAnswer}:{message:string;options:Options;onAnswer:(answer:boolean)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement;const element=dialog.current;element?.showModal();cancel.current?.focus();return()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[]);
 return <dialog ref={dialog} className="confirmation-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onKeyDown={event=>{if(event.key==='Escape')event.stopPropagation();}} onCancel={event=>{event.preventDefault();onAnswer(false);}}>
  <h2 id="confirmation-title">{options.title??'Confirm action'}</h2><p id="confirmation-description">{message}</p>
  <div className="confirmation-actions"><button ref={cancel} onClick={()=>onAnswer(false)}>Cancel</button><button className={options.danger?'danger':'primary'} onClick={()=>onAnswer(true)}>{options.confirmLabel??'Continue'}</button></div>
 </dialog>;
}
export function useConfirmation(){const confirm=useContext(ConfirmationContext);if(!confirm)throw new Error('Confirmation provider is missing');return confirm;}
