import { z } from 'zod';

import { aiProviders, type AIProvider } from './providers';
export type { AIProvider } from './providers';
export type AISettings = {provider:AIProvider; endpoint:string; model:string; jsonMode?:boolean};
export type AIRequest = {instructions:string; input:unknown; schema:Record<string,unknown>; signal?:AbortSignal};
export interface AIAdapter {request(request:AIRequest):Promise<string>}
export const defaultSettings:AISettings = {provider:'openai',endpoint:'https://api.openai.com/v1',model:''};
export function savePreferences(settings:AISettings,storage:Pick<Storage,'setItem'>=localStorage){storage.setItem('planner-ai-preferences',JSON.stringify({provider:settings.provider,endpoint:settings.endpoint,model:settings.model,...(settings.jsonMode!==undefined?{jsonMode:settings.jsonMode}:{})}));}
export function loadPreferences(storage:Pick<Storage,'getItem'>=localStorage):AISettings {try {const parsed=z.object({provider:z.enum(aiProviders),endpoint:z.string(),model:z.string(),jsonMode:z.boolean().optional()}).strict().parse(JSON.parse(storage.getItem('planner-ai-preferences')??'null'));return parsed;}catch{return {...defaultSettings};}}
export const privacyNotice='Submitting sends the requirements, assumptions, and selected service catalog directly to your configured AI endpoint. Provider usage may incur charges. API keys remain in memory and are cleared when this page closes.';

const openAIResponse=z.object({choices:z.array(z.object({message:z.object({content:z.string()})})).min(1)});
const anthropicResponse=z.object({content:z.array(z.object({type:z.string(),text:z.string().optional()}))});
const geminiResponse=z.object({candidates:z.array(z.object({content:z.object({parts:z.array(z.object({text:z.string().optional()}))})})).min(1)});
export function createAdapter(settings:AISettings,key:string,fetcher:typeof fetch=fetch,timeoutMs=60000):AIAdapter {
  // Credentials are captured only in this in-memory closure; no persistence/logging.
  return {async request(request){
    if(!settings.model.trim())throw new Error('Enter an AI model name.');
    if(settings.provider!=='local'&&!key.trim())throw new Error('Enter an API key for this provider.');
    let endpoint:URL;try{endpoint=new URL(settings.endpoint);}catch{throw new Error('Enter a valid AI API base URL.');}
    if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('Use an endpoint without credentials, query parameters, or fragments.');
    if(endpoint.protocol!=='https:'&&!(settings.provider==='local'&&endpoint.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)))throw new Error('Use HTTPS, or HTTP on localhost for a local model.');
    const controller=new AbortController(); let timedOut=false;
    const abort=()=>controller.abort();request.signal?.addEventListener('abort',abort,{once:true});if(request.signal?.aborted)abort();
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
    const instructions=`${request.instructions}\nReturn only a JSON object conforming to this schema: ${JSON.stringify(request.schema)}`;
    const input=JSON.stringify(request.input);const headers:Record<string,string>={'Content-Type':'application/json'};
    let path='/chat/completions';let body:unknown={model:settings.model,messages:[{role:'system',content:instructions},{role:'user',content:input}],...(settings.jsonMode!==false?{response_format:{type:'json_object'}}:{}),...(settings.provider==='openrouter'&&settings.jsonMode!==false?{provider:{require_parameters:true}}:{})};
    if(settings.provider==='anthropic'){path='/messages';headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';headers['anthropic-dangerous-direct-browser-access']='true';body={model:settings.model,max_tokens:8192,system:instructions,messages:[{role:'user',content:input}]};}
    else if(settings.provider==='gemini'){path=`/models/${encodeURIComponent(settings.model)}:generateContent`;headers['x-goog-api-key']=key;body={systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{responseMimeType:'application/json'}};}
    else if(key.trim())headers.Authorization=`Bearer ${key.trim()}`;
    try {
      if(controller.signal.aborted)throw new Error('Cancelled');
      const response=await fetcher(`${settings.endpoint.replace(/\/$/,'')}${path}`,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
      if(!response.ok)throw new Error(response.status===401||response.status===403?'AI authentication failed. Check your key and model access.':response.status===402?'AI provider credits are unavailable. Check your account balance.':response.status===400?'AI request rejected. Check the model ID and whether it supports JSON mode.':response.status===404?'AI endpoint or model was not found. Check the API base URL and model ID.':response.status===429?'AI rate limit reached. Try again later.':`AI request failed (HTTP ${response.status}).`);
      const data:unknown=await response.json();
      if(settings.provider==='anthropic')return anthropicResponse.parse(data).content.filter(x=>x.type==='text').map(x=>x.text??'').join('');
      if(settings.provider==='gemini')return geminiResponse.parse(data).candidates[0].content.parts.map(x=>x.text??'').join('');
      return openAIResponse.parse(data).choices[0].message.content;
    }catch(error){if(controller.signal.aborted)throw new Error(timedOut?'AI request timed out. Try again.':'AI request cancelled.',{cause:error});if(error instanceof TypeError)throw new Error('Browser could not connect to the AI endpoint. Check network, endpoint, and browser CORS permissions. No proxy is configured.',{cause:error});if(error instanceof z.ZodError)throw new Error('AI endpoint returned an unsupported response envelope.',{cause:error});throw error;}
    finally {clearTimeout(timer);request.signal?.removeEventListener('abort',abort);}
  }};
}

export async function structuredOutput<T>(adapter:AIAdapter,instructions:string,input:unknown,schema:z.ZodType<T>,signal?:AbortSignal,validate?:(value:T)=>void):Promise<T>{
  const jsonSchema=z.toJSONSchema(schema) as Record<string,unknown>;let repair='';
  for(let attempt=0;attempt<2;attempt++){
    const text=await adapter.request({instructions:instructions+repair,input,schema:jsonSchema,signal});
    try {const value=schema.parse(JSON.parse(text));validate?.(value);return value;}
    catch {if(attempt===1)throw new Error('AI output failed validation after one repair. Your project was not changed. Try again or continue manually.');repair='\nThe previous response failed schema or reference validation. Repair the JSON with valid IDs, references, provider/service compatibility and provenance. Do not add positions, costs, XML, or extra fields.';}
  }
  throw new Error('Unreachable');
}
