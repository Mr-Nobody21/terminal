import { createHash } from 'node:crypto';
import type { Pool,PoolClient } from 'pg';
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export class ThrottleError extends Error {
 readonly statusCode=429;
 constructor(public retryAfter:number){super('Too many attempts. Try again later.');}
}
// Atomic shared counters protect an account even if requests come from different IPs/processes.
export async function throttle(pool:Pool,scope:string,key:string,max:number,seconds:number){
 const result=await pool.query<{attempts:number;retry_after:number}>(`INSERT INTO security_rate_limits(key_hash,attempts,expires_at)
 VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key_hash) DO UPDATE SET
 attempts=CASE WHEN security_rate_limits.expires_at<=now() THEN 1 ELSE security_rate_limits.attempts+1 END,
 expires_at=CASE WHEN security_rate_limits.expires_at<=now() THEN excluded.expires_at ELSE security_rate_limits.expires_at END
 RETURNING attempts,ceil(extract(epoch FROM expires_at-now()))::int AS retry_after`,[digest(scope+':'+key),seconds]);
 if(result.rows[0].attempts>max)throw new ThrottleError(result.rows[0].retry_after);
}
export async function resetThrottle(client:PoolClient,scope:string,key:string){await client.query('DELETE FROM security_rate_limits WHERE key_hash=$1',[digest(scope+':'+key)]);}
export async function audit(client:Pool|PoolClient,event:string,ip:string,userId?:string){
 await client.query('INSERT INTO security_events(event,ip_hash,user_id) VALUES($1,$2,$3)',[event,digest(ip),userId??null]);
}
export async function pruneSecurity(pool:Pool){
 // Bounded deletes avoid a maintenance request monopolizing the database.
 await pool.query('DELETE FROM security_rate_limits WHERE key_hash IN (SELECT key_hash FROM security_rate_limits WHERE expires_at<now() LIMIT 1000)');
 await pool.query('DELETE FROM auth_challenges WHERE token_hash IN (SELECT token_hash FROM auth_challenges WHERE expires_at<now() LIMIT 1000)');
 await pool.query("DELETE FROM security_events WHERE id IN (SELECT id FROM security_events WHERE created_at<now()-interval '30 days' LIMIT 1000)");
 await pool.query('DELETE FROM sessions WHERE token_hash IN (SELECT token_hash FROM sessions WHERE expires_at<now() LIMIT 1000)');
}
