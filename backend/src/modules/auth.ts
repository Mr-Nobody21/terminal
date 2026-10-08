import { randomBytes,randomUUID } from 'node:crypto';
import type { Pool,PoolClient } from 'pg';
import type { FastifyInstance,FastifyRequest,FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Config } from '../config';
import { hashPassword,verifyPassword } from '../security/password';
import { verifyDevelopmentOtp } from '../security/otp';
import { audit,digest,throttle,resetThrottle } from '../security/throttle';
export { hashPassword,verifyPassword } from '../security/password';
export const tokenHash=digest;
const credentials=z.object({email:z.string().trim().toLowerCase().email().max(254),password:z.string().min(12).max(128)}).strict();
const registration=credentials.extend({displayName:z.string().trim().min(1).max(100)});
const otpSchema=z.object({otp:z.string().regex(/^\d{6}$/,'Enter six digits')}).strict();
const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
const challengeSeconds=300;
export interface User {id:string;email:string;displayName:string}
interface Account extends User {auth_version:number;password_hash:string}
export function authModule(app:FastifyInstance,pool:Pool,config:Config){
 const cookie={path:'/api',httpOnly:true,secure:config.secureCookies,sameSite:config.crossSiteCookies?'none' as const:'lax' as const};
 const challengeCookie={...cookie,path:'/api/auth'};
 const authOptions={bodyLimit:4096,config:{rateLimit:{max:10,timeWindow:'15 minutes'}}};
 const dummy='scrypt-v2$00000000000000000000000000000000$'+'00'.repeat(64);
 function challengeFailure(){return Object.assign(new Error('Invalid or expired verification code. Start again if the challenge has expired.'),{statusCode:401});}
 async function transaction<T>(action:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await pool.connect();
  try{await client.query('BEGIN');const result=await action(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 }
 async function user(request:FastifyRequest):Promise<User>{
  const parsed=tokenSchema.safeParse(request.cookies.planner_session);
  if(!parsed.success)throw Object.assign(new Error('Sign in required'),{statusCode:401});
  const hash=tokenHash(parsed.data);
  const result=await pool.query<User&{last_seen_at:Date}>(`SELECT u.id,u.email,u.display_name AS "displayName",s.last_seen_at
   FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()
   AND s.mfa_verified_at IS NOT NULL AND s.last_seen_at>now()-interval '30 minutes'`,[hash]);
  const account=result.rows[0];
  if(!account)throw Object.assign(new Error('Session expired. Please sign in again.'),{statusCode:401});
  if(Date.now()-account.last_seen_at.getTime()>60000)await pool.query('UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1',[hash]);
  return {id:account.id,email:account.email,displayName:account.displayName};
 }
 async function challenge(client:PoolClient,account:Pick<Account,'id'|'auth_version'>){
  const token=randomBytes(32).toString('hex');
  await client.query(`INSERT INTO auth_challenges(token_hash,user_id,auth_version,expires_at) VALUES($1,$2,$3,now()+$4*interval '1 second')
   ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,auth_version=excluded.auth_version,expires_at=excluded.expires_at,attempts=0,created_at=now()`,[tokenHash(token),account.id,account.auth_version,challengeSeconds]);
  return token;
 }
 function pending(reply:FastifyReply,token:string,status=200){
  reply.clearCookie('planner_session',cookie);
  reply.setCookie('planner_challenge',token,{...challengeCookie,maxAge:challengeSeconds});
  return reply.code(status).send({otpRequired:true,expiresIn:challengeSeconds,method:'development-fixed'});
 }
 async function passwordLimits(request:FastifyRequest,email:string){
  await throttle(pool,'password-ip',request.ip,30,900);
  await throttle(pool,'password-account',email,8,900);
 }
 app.post('/api/auth/register',authOptions,async(request,reply)=>{
  const input=registration.parse(request.body);
  await throttle(pool,'register-ip',request.ip,5,3600);
  const hash=await hashPassword(input.password);
  try{
   const token=await transaction(async client=>{
    if(request.cookies.planner_session)await client.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(request.cookies.planner_session)]);
    const result=await client.query<Pick<Account,'id'|'auth_version'>>('INSERT INTO users(id,email,display_name,password_hash) VALUES($1,$2,$3,$4) RETURNING id,auth_version',[randomUUID(),input.email,input.displayName,hash]);
    const account=result.rows[0];await audit(client,'registration_pending',request.ip,account.id);return challenge(client,account);
   });
   return pending(reply,token,201);
  }catch(error){if((error as {code?:string}).code==='23505')return reply.code(409).send({error:'Unable to create account with these details'});throw error;}
 });
 app.post('/api/auth/login',authOptions,async(request,reply)=>{
  const input=credentials.parse(request.body);
  await passwordLimits(request,input.email);
  const result=await pool.query<Account>('SELECT id,email,display_name AS "displayName",password_hash,auth_version FROM users WHERE email=$1',[input.email]);
  const account=result.rows[0],valid=await verifyPassword(input.password,account?.password_hash??dummy);
  if(!valid||!account){await audit(pool,'password_failed',request.ip);return reply.code(401).send({error:'Invalid email or password'});}
  const upgraded=account.password_hash.startsWith('scrypt-v1$')?await hashPassword(input.password):undefined;
  const token=await transaction(async client=>{
   if(upgraded){const updated=await client.query('UPDATE users SET password_hash=$1 WHERE id=$2 AND password_hash=$3 AND auth_version=$4',[upgraded,account.id,account.password_hash,account.auth_version]);if(!updated.rowCount)throw Object.assign(new Error('Credentials changed. Sign in again.'),{statusCode:409});}
   if(request.cookies.planner_session)await client.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(request.cookies.planner_session)]);
   await audit(client,'password_verified',request.ip,account.id);return challenge(client,account);
  });
  return pending(reply,token);
 });
 app.post('/api/auth/verify-otp',{bodyLimit:1024,config:{rateLimit:{max:20,timeWindow:'15 minutes'}}},async(request,reply)=>{
  const input=otpSchema.parse(request.body);
  await throttle(pool,'otp-ip',request.ip,30,900);
  const parsed=tokenSchema.safeParse(request.cookies.planner_challenge);
  if(!parsed.success)throw challengeFailure();
  const result=await transaction(async client=>{
   const found=await client.query<Account&{attempts:number}>(`SELECT u.id,u.email,u.display_name AS "displayName",u.auth_version,c.attempts
    FROM auth_challenges c JOIN users u ON u.id=c.user_id WHERE c.token_hash=$1 AND c.expires_at>now()
    AND c.attempts<5 AND c.auth_version=u.auth_version FOR UPDATE OF c,u`,[tokenHash(parsed.data)]);
   const account=found.rows[0];
   if(!account)return undefined;
   if(!verifyDevelopmentOtp(input.otp)){
    await client.query('UPDATE auth_challenges SET attempts=attempts+1 WHERE token_hash=$1',[tokenHash(parsed.data)]);
    await audit(client,'otp_failed',request.ip,account.id);
    return undefined;
   }
   const token=randomBytes(32).toString('hex');
   await client.query('DELETE FROM auth_challenges WHERE user_id=$1',[account.id]);
   if(request.cookies.planner_session)await client.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(request.cookies.planner_session)]);
   // Keep at most five active sessions per account; new verification rotates this browser's token.
   await client.query(`DELETE FROM sessions WHERE user_id=$1 AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id=$1 AND expires_at>now() AND mfa_verified_at IS NOT NULL AND last_seen_at>now()-interval '30 minutes' ORDER BY created_at DESC LIMIT 4)`,[account.id]);
   await client.query(`INSERT INTO sessions(token_hash,user_id,expires_at,mfa_verified_at) VALUES($1,$2,now()+$3*interval '1 second',now())`,[tokenHash(token),account.id,config.sessionSeconds]);
   await resetThrottle(client,'password-account',account.email);
   await audit(client,'login_verified',request.ip,account.id);
   return {token,user:{id:account.id,email:account.email,displayName:account.displayName}};
  });
  if(!result)throw challengeFailure();
  reply.clearCookie('planner_challenge',challengeCookie);
  reply.setCookie('planner_session',result.token,{...cookie,maxAge:config.sessionSeconds});
  return {user:result.user};
 });
 app.get('/api/auth/me',async request=>({user:await user(request)}));
 app.post('/api/auth/logout',{bodyLimit:1024},async(request,reply)=>{
  await transaction(async client=>{
   if(request.cookies.planner_challenge)await client.query('DELETE FROM auth_challenges WHERE token_hash=$1',[tokenHash(request.cookies.planner_challenge)]);
   if(request.cookies.planner_session)await client.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(request.cookies.planner_session)]);
   await audit(client,'logout',request.ip);
  });
  reply.clearCookie('planner_session',cookie);reply.clearCookie('planner_challenge',challengeCookie);return {ok:true};
 });
 app.post('/api/auth/password',authOptions,async(request,reply)=>{
  const account=await user(request),input=z.object({currentPassword:z.string().max(128),newPassword:credentials.shape.password,otp:otpSchema.shape.otp}).strict().parse(request.body);
  await passwordLimits(request,account.email);
  const current=(await pool.query<Account>('SELECT password_hash,auth_version FROM users WHERE id=$1',[account.id])).rows[0];
  if(!await verifyPassword(input.currentPassword,current.password_hash)||!verifyDevelopmentOtp(input.otp))return reply.code(401).send({error:'Current password or verification code is incorrect'});
  const hash=await hashPassword(input.newPassword);
  await transaction(async client=>{
   await client.query('DELETE FROM auth_challenges WHERE user_id=$1',[account.id]);
   const changed=await client.query('UPDATE users SET password_hash=$1,auth_version=auth_version+1 WHERE id=$2 AND auth_version=$3',[hash,account.id,current.auth_version]);
   if(!changed.rowCount)throw Object.assign(new Error('Credentials changed. Sign in again.'),{statusCode:409});
   await client.query('DELETE FROM sessions WHERE user_id=$1',[account.id]);
   await audit(client,'password_changed',request.ip,account.id);
  });
  reply.clearCookie('planner_session',cookie);reply.clearCookie('planner_challenge',challengeCookie);return {ok:true};
 });
 return user;
}
