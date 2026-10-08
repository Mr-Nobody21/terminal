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
