import { describe,it,expect,vi } from 'vitest';
import { z } from 'zod';
import { createAdapter,savePreferences,loadPreferences,structuredOutput,type AIProvider } from './adapter';
const request={instructions:'JSON',input:{text:'hello'},schema:{type:'object'}};
describe('browser AI adapters',()=>{
  it.each(['openai','openrouter','groq','compatible','local','anthropic','gemini'] as AIProvider[])('normalizes %s responses',async provider=>{
    const envelope=provider==='anthropic'?{content:[{type:'text',text:'{"ok":true}'}]}:provider==='gemini'?{candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]}:{choices:[{message:{content:'{"ok":true}'}}]};
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(envelope)));
    expect(await createAdapter({provider,endpoint:'https://example.com/v1',model:'configured-model'},'secret',fetcher).request(request)).toBe('{"ok":true}');
    expect(String(fetcher.mock.calls[0][1]?.body)).toContain('JSON');
  });
  it('persists preferences without credentials even when supplied extra runtime fields',()=>{const storage={setItem:vi.fn()};const settings={provider:'openai' as const,endpoint:'https://example.com',model:'chosen',apiKey:'secret'};savePreferences(settings,storage);expect(storage.setItem.mock.calls[0][1]).not.toContain('secret');});
  it.each([401,429,500])('reports HTTP %s without leaking response credentials',async status=>{const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response('secret',{status}));await expect(createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'local'},'',fetcher).request(request)).rejects.not.toThrow('secret');});
  it('reports browser network restrictions',async()=>{const fetcher=vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));await expect(createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'local'},'',fetcher).request(request)).rejects.toThrow('CORS');});
  it('cancels before fetching',async()=>{const controller=new AbortController();controller.abort();const fetcher=vi.fn<typeof fetch>();await expect(createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'local'},'',fetcher).request({...request,signal:controller.signal})).rejects.toThrow('cancelled');expect(fetcher).not.toHaveBeenCalled();});
  it('times out and aborts the request',async()=>{const fetcher=vi.fn<typeof fetch>().mockImplementation((_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')))));await expect(createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'local'},'',fetcher,5).request(request)).rejects.toThrow('timed out');});
  it('allows exactly one bounded repair',async()=>{const adapter={request:vi.fn().mockResolvedValue('bad')};await expect(structuredOutput(adapter,'JSON',{},z.object({ok:z.boolean()}).strict())).rejects.toThrow('one repair');expect(adapter.request).toHaveBeenCalledTimes(2);});
  it('repairs invalid JSON and validates before returning',async()=>{const adapter={request:vi.fn().mockResolvedValueOnce('bad').mockResolvedValueOnce('{"ok":true}')};expect(await structuredOutput(adapter,'JSON',{},z.object({ok:z.boolean()}))).toEqual({ok:true});});
});

it.each([
  ['openrouter', 'https://openrouter.ai/api/v1'],
  ['groq', 'https://api.groq.com/openai/v1'],
  ['compatible', 'https://custom.example/api/v1'],
] as const)('uses %s bearer authentication and the compatible request contract', async (provider, endpoint) => {
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]})));
  await createAdapter({provider,endpoint:endpoint+'/',model:'provider/model'},'memory-secret',fetcher).request(request);
  const [url, init]=fetcher.mock.calls[0];
  expect(url).toBe(endpoint+'/chat/completions');
  expect(init?.headers).toMatchObject({Authorization:'Bearer memory-secret'});
  const body=JSON.parse(String(init?.body));
  expect(body.model).toBe('provider/model');
  expect(body.response_format).toEqual({type:'json_object'});
  expect(body.provider).toEqual(provider==='openrouter'?{require_parameters:true}:undefined);
  expect(String(init?.body)).not.toContain('memory-secret');
});
it('can omit JSON mode for compatible models while still validating their output', async () => {
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]})));
  const adapter=createAdapter({provider:'openrouter',endpoint:'https://openrouter.ai/api/v1',model:'provider/model',jsonMode:false},'key',fetcher);
  expect(await structuredOutput(adapter,'JSON',{},z.object({ok:z.boolean()}).strict())).toEqual({ok:true});
  const body=JSON.parse(String(fetcher.mock.calls[0][1]?.body));
  expect(body).not.toHaveProperty('response_format');
  expect(body).not.toHaveProperty('provider');
});
it('retains old preferences and persists new providers without credentials', () => {
  const old={provider:'local',endpoint:'http://localhost:1234/v1',model:'mock'};
  expect(loadPreferences({getItem:()=>JSON.stringify(old)})).toEqual(old);
  for(const provider of ['openrouter','groq','compatible'] as const){
    let saved='';
    savePreferences({provider,endpoint:'https://example.com/v1',model:'mock',jsonMode:false}, {setItem:(_key,value)=>{saved=value;}});
    expect(loadPreferences({getItem:()=>saved})).toEqual({provider,endpoint:'https://example.com/v1',model:'mock',jsonMode:false});
  }
});
it.each(['http://remote.example/v1','https://key@example.com/v1','https://example.com/v1?key=secret',''])('rejects unsafe or invalid custom endpoints before sending a key: %s', async endpoint => {
  const fetcher=vi.fn<typeof fetch>();
  await expect(createAdapter({provider:'compatible',endpoint,model:'mock'},'key',fetcher).request(request)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it('reports exhausted provider credits without exposing the provider response', async () => {
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response('memory-secret', {status:402}));
  await expect(createAdapter({provider:'openrouter',endpoint:'https://openrouter.ai/api/v1',model:'provider/model'},'memory-secret',fetcher).request(request)).rejects.toThrow('credits');
});
it.each(['', '   '])('local models accept blank keys and omit Authorization', async key => {
 const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]})));
 await createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'loaded-model'},key,fetcher).request(request);
 expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
});
it('local models can opt into API-key authentication', async () => {
 const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]})));
 await createAdapter({provider:'local',endpoint:'http://localhost:1234/v1',model:'loaded-model'},' local-key ',fetcher).request(request);
 expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({Authorization:'Bearer local-key'});
});
