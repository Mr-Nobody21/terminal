import {useLayoutEffect,useRef} from 'react';
export function Notice({message,onDismiss,onSize}:{message:string;onDismiss?:()=>void;onSize:(height:number)=>void}){
 const element=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const node=element.current;if(!node)return;const measure=()=>onSize(Math.ceil(node.getBoundingClientRect().height)+24);measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>{observer.disconnect();onSize(0);};},[message,onSize]);
 return <div ref={element} className="notice zen-notice" role="alert"><span>{message}</span>{onDismiss&&<button aria-label="Dismiss notification" onClick={onDismiss}>×</button>}</div>;
}
