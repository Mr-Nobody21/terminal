import {renderHook,act,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {useAI} from './AIControls';
import {sampleProject} from '@planner/domain/examples';
import {commit} from '@planner/domain/model';
afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear();});
it('rejects a stale AI result if the user edits the project during a request',async()=>{let resolve!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>{resolve=r;})));const project=sampleProject(),onChange=vi.fn(),onError=vi.fn();const hook=renderHook(({project})=>useAI(project,onChange,onError),{initialProps:{project}});act(()=>{hook.result.current.updateSettings({provider:'openai',endpoint:'https://api.openai.com/v1',model:'mock'});hook.result.current.setKey('memory-key');});let request!:Promise<void>;act(()=>{request=hook.result.current.run('extract');});hook.rerender({project:commit(project,d=>{d.name='User edit';})});await act(async()=>{resolve(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({facts:[],unknowns:[],assumptions:[]})}}]})));await request;});expect(onChange).not.toHaveBeenCalled();expect(onError).toHaveBeenCalledWith(expect.stringContaining('Project changed'));expect(localStorage.getItem('planner-ai-preferences')).not.toContain('memory-key');});
it('clears active busy state when switching projects and never applies the old result',async()=>{vi.stubGlobal('fetch',vi.fn((_url,init:RequestInit)=>new Promise((_resolve,reject)=>init.signal?.addEventListener('abort',()=>reject(new DOMException('cancelled','AbortError'))))));const project=sampleProject(),onChange=vi.fn(),onError=vi.fn();const hook=renderHook(({project})=>useAI(project,onChange,onError),{initialProps:{project}});act(()=>{hook.result.current.updateSettings({provider:'local',endpoint:'http://localhost:1234/v1',model:'mock'});});let request!:Promise<void>;act(()=>{request=hook.result.current.run('extract');});hook.rerender({project:sampleProject()});await act(async()=>await request);expect(onChange).not.toHaveBeenCalled();expect(hook.result.current.busy).toBe('');});

it('clears keys when switching provider or endpoint, but retains them for model and JSON-mode edits',()=>{
  const hook=renderHook(()=>useAI(sampleProject(),vi.fn(),vi.fn()));
  act(()=>hook.result.current.setKey('openai-secret'));
  act(()=>hook.result.current.updateSettings({provider:'openrouter',endpoint:'https://openrouter.ai/api/v1',model:'provider/model'}));
  expect(hook.result.current.key).toBe('');
  act(()=>hook.result.current.setKey('router-secret'));
  act(()=>hook.result.current.updateSettings({...hook.result.current.settings,model:'provider/other',jsonMode:false}));
  expect(hook.result.current.key).toBe('router-secret');
  expect(localStorage.getItem('planner-ai-preferences')).not.toContain('router-secret');
  act(()=>hook.result.current.updateSettings({...hook.result.current.settings,endpoint:'https://custom.example/v1'}));
  expect(hook.result.current.key).toBe('');
});
