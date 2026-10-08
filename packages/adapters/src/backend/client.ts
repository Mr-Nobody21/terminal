export interface Account {id:string;email:string;displayName:string}
export interface PendingVerification {otpRequired:true;expiresIn:number;method:'development-fixed'}
export interface ApiFieldError {path:string;message:string}
const base=(import.meta.env.VITE_BACKEND_URL??'/api').replace(/\/$/,'');
export class ApiError extends Error {constructor(message:string,public status:number,public retryAfter?:number,public fields?:ApiFieldError[],options?:ErrorOptions){super(message,options);}}
function statusMessage(status:number,path:string){
 if(status===400||status===422)return 'Some details were not accepted. Check your entries and try again.';
 if(status===401)return path==='/auth/login'?'Invalid email or password.':path==='/auth/verify-otp'?'Invalid or expired verification code. Start again.':'Your session has expired. Please sign in again.';
 if(status===403)return 'This request is not permitted. Check the configured app origin or sign in again.';
 if(status===404)return 'The requested item or API endpoint was not found.';
 if(status===409)return path==='/auth/register'?'Unable to create an account with these details. Try signing in or use another email address.':'This item changed in another session. Reload before saving.';
 if(status===413)return 'This file or request is too large. Choose a smaller file.';
 if(status===429)return 'Too many attempts. Wait before trying again.';
 if(status>=500)return 'The backend is temporarily unavailable. Try again shortly. Your current work has not been changed.';
 return `Request failed (HTTP ${status}). Try again.`;
}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 const cancel=()=>controller.abort(options.signal?.reason);
 options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
 try{
  const response=await fetch(base+path,{...options,signal:controller.signal,credentials:'include',headers:{...(options.body != null ? {'Content-Type':'application/json'} : {}),'X-Planner-Request':'1',...options.headers}});
  let data:unknown;
  const text=await response.text();try{data=text?JSON.parse(text):undefined;}catch{data=undefined;}
  if(!response.ok){
   const body=data&&typeof data==='object'?data as Record<string,unknown>:{};
   const fields=Array.isArray(body.fields)?body.fields.filter((field):field is ApiFieldError=>!!field&&typeof field==='object'&&typeof field.path==='string'&&typeof field.message==='string').map(field=>({path:field.path,message:field.message.slice(0,300)})):undefined;
   const rawRetry=response.headers.get('Retry-After'),seconds=rawRetry===null?NaN:Number(rawRetry),retry=Number.isFinite(seconds)?seconds:rawRetry?(Date.parse(rawRetry)-Date.now())/1000:NaN;
   const serverMessage=typeof body.error==='string'&&body.error.trim()&&body.error!=='Validation failed'?body.error.slice(0,500):undefined;
   throw new ApiError(serverMessage||(fields?.length?'Check the highlighted fields and try again.':statusMessage(response.status,path)),response.status,Number.isFinite(retry)&&retry>0?Math.ceil(retry):undefined,fields);
  }
  if(response.status===204)return undefined as T;
  if(data===undefined||data===null)throw new ApiError('The backend returned an invalid response. Check the API URL and try again.',response.status);
  return data as T;
 }catch(error){
  if(controller.signal.aborted)throw new ApiError(options.signal?.aborted?'Request cancelled':'Backend request timed out. Try again.',0,undefined,undefined,{cause:error});
  if(error instanceof TypeError)throw new ApiError('Cannot reach the backend. Check that the server is running and your connection is available.',0,undefined,undefined,{cause:error});
  throw error;
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
export async function uploadImage(imageData:string,name:string){const [header,base64]=imageData.split(',');return api<{id:string}>('/assets',{method:'POST',body:JSON.stringify({name,mime:header.slice(5).split(';')[0],base64})});}
