import { describe,it,expect,vi } from 'vitest';
import { z } from 'zod';
import { createAdapter,savePreferences,structuredOutput,type AIProvider } from './adapter';
const request={instructions:'JSON',input:{text:'hello'},schema:{type:'object'}};
describe('browser AI adapters',()=>{
  it.each(['openai','local','anthropic','gemini'] as AIProvider[])('normalizes %s responses',async provider=>{
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
