import { afterEach,it,expect,vi } from 'vitest';
import { api,ApiError } from './client';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('preserves server retry guidance without retrying credentials automatically',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Too many attempts'}),{status:429,headers:{'Retry-After':'15'}}));vi.stubGlobal('fetch',fetcher);
 await expect(api('/auth/login',{method:'POST',body:'{}'})).rejects.toMatchObject({status:429,retryAfter:15});expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'include',headers:{'X-Planner-Request':'1'}});
});
it('times out stalled requests and supports explicit cancellation',async()=>{
 vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn((_url,options:RequestInit)=>new Promise((_resolve,reject)=>{if(options.signal?.aborted)reject(new Error('Abort'));else options.signal?.addEventListener('abort',()=>reject(new Error('Abort')),{once:true});})));
 const request=api('/auth/me');const result=expect(request).rejects.toEqual(expect.objectContaining({status:0,message:expect.stringContaining('timed out')}));await vi.advanceTimersByTimeAsync(20000);await result;
 const controller=new AbortController();controller.abort();await expect(api('/auth/me',{signal:controller.signal})).rejects.toBeInstanceOf(ApiError);
});
it.each([400,401,403,404,409,413,422,429,500,502,503])('preserves HTTP %s with useful fallback messages for non-JSON failures',async status=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>proxy failure</html>',{status})));
 await expect(api('/auth/login')).rejects.toMatchObject({status,message:expect.any(String)});
 await expect(api('/auth/login')).rejects.not.toThrow('<html>');
});
it('retains structured field errors and rejects unsafe error envelopes',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Validation failed',fields:[{path:'email',message:'Invalid email'},null,{path:7,message:{}}]}),{status:400})));
 await expect(api('/auth/register')).rejects.toMatchObject({status:400,message:expect.stringContaining('fields'),fields:[{path:'email',message:'Invalid email'}]});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{private:'detail'}}),{status:503})));
 await expect(api('/auth/me')).rejects.toThrow('temporarily unavailable');
});
it('handles empty success, malformed success and connection failures distinctly',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:204})));
 await expect(api('/projects/example',{method:'DELETE'})).resolves.toBeUndefined();
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('not JSON',{status:200})));
 await expect(api('/auth/me')).rejects.toMatchObject({status:200,message:expect.stringContaining('invalid response')});
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
 await expect(api('/auth/me')).rejects.toMatchObject({status:0,message:expect.stringContaining('server is running')});
});
it('supports HTTP-date retry guidance',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-09T00:00:00Z'));
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:429,headers:{'Retry-After':'Fri, 09 Oct 2026 00:00:30 GMT'}})));
 await expect(api('/auth/login')).rejects.toMatchObject({status:429,retryAfter:30});
});
it('omits JSON content type for bodyless requests including logout',async()=>{
 const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(new Response('{"ok":true}')));vi.stubGlobal('fetch',fetcher);
 await api('/auth/logout',{method:'POST'});
 expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty('Content-Type');
 expect(fetcher.mock.calls[0][1].headers).toHaveProperty('X-Planner-Request','1');
 await api('/auth/login',{method:'POST',body:'{}'});
 expect(fetcher.mock.calls[1][1].headers).toHaveProperty('Content-Type','application/json');
});
