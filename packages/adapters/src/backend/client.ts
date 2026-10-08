export interface Account {id:string;email:string;displayName:string}
export interface PendingVerification {otpRequired:true;expiresIn:number;method:'development-fixed'}
const base=(import.meta.env.VITE_BACKEND_URL??'/api').replace(/\/$/,'');
export class ApiError extends Error {constructor(message:string,public status:number,public retryAfter?:number){super(message);}}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),20000);
 const cancel=()=>controller.abort(options.signal?.reason);
 options.signal?.addEventListener('abort',cancel,{once:true});
 if(options.signal?.aborted)cancel();
 try{
  const response=await fetch(base+path,{...options,signal:controller.signal,credentials:'include',headers:{'Content-Type':'application/json','X-Planner-Request':'1',...options.headers}});
  const data=await response.json().catch(()=>({error:'Invalid server response'}));
  if(!response.ok){const retry=Number(response.headers.get('Retry-After'));throw new ApiError(data.error??'Request failed',response.status,Number.isFinite(retry)&&retry>0?retry:undefined);}
  return data as T;
 }catch(error){if(controller.signal.aborted)throw new ApiError(options.signal?.aborted?'Request cancelled':'Backend request timed out. Try again.',0);throw error;}
 finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
export async function uploadImage(imageData:string,name:string){const [header,base64]=imageData.split(',');return api<{id:string}>('/assets',{method:'POST',body:JSON.stringify({name,mime:header.slice(5).split(';')[0],base64})});}
