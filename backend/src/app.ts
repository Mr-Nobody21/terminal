import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import type { Pool } from 'pg';
import type { Config } from './config';
import { authModule } from './modules/auth';
import { assetModule,PostgresAssetStorage } from './modules/assets';
import { pruneSecurity,ThrottleError } from './security/throttle';
import { projectModule } from './modules/projects';
export async function buildApp(pool:Pool,config:Config,logger=false){
 const app=Fastify({bodyLimit:10000000,requestTimeout:15000,connectionTimeout:10000,keepAliveTimeout:10000,maxRequestsPerSocket:100,logger:logger?{redact:['req.headers.cookie','req.headers.authorization','body.password','body.currentPassword','body.newPassword','body.base64','body.otp','req.body.otp','req.body.password','res.headers.set-cookie']} : false,trustProxy:false});
 await app.register(rateLimit,{global:false,max:300,timeWindow:'1 minute',cache:10000});
 const globalLimiter=app.createRateLimit({max:300,timeWindow:'1 minute'});
 app.addHook('onRequest',async request=>{const result=await globalLimiter(request);if(!result.isAllowed&&result.isExceeded)throw new ThrottleError(result.ttlInSeconds);});
 await app.register(cookie);
 await app.register(cors,{origin:config.origins,credentials:true,allowedHeaders:['Content-Type','X-Planner-Request'],methods:['GET','POST','PUT','DELETE','OPTIONS']});
 const maintenance=setInterval(()=>{void pruneSecurity(pool).catch(()=>app.log.error('Security retention cleanup failed'));},60000);maintenance.unref();
 app.addHook('onClose',async()=>{clearInterval(maintenance);});
 app.addHook('onRequest',async(request,reply)=>{
  reply.header('X-Content-Type-Options','nosniff').header('X-Frame-Options','DENY').header('Referrer-Policy','no-referrer').header('Permissions-Policy','camera=(), microphone=(), geolocation=()').header('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if(config.secureCookies)reply.header('Strict-Transport-Security','max-age=31536000');
  if(request.url.startsWith('/api/'))reply.header('Cache-Control','no-store');
  if(!['GET','HEAD','OPTIONS'].includes(request.method)){
   const origin=request.headers.origin;
   if(request.headers['x-planner-request']!=='1'||(origin&&!config.origins.includes(origin)))return reply.code(403).send({error:'Request origin or CSRF header is invalid'});
  }
 });
 app.addHook('onSend',async(_request,reply,payload)=>{reply.header('X-Content-Type-Options','nosniff').header('X-Frame-Options','DENY').header('Referrer-Policy','no-referrer');if(!reply.hasHeader('Cache-Control'))reply.header('Cache-Control','no-store');return payload;});
 app.setErrorHandler((error,request,reply)=>{
  if(error instanceof ZodError)return reply.code(400).send({error:'Validation failed',fields:error.issues.map(i=>({path:i.path.join('.'),message:i.message}))});
  const failure=error as {statusCode?:number;code?:string;message?:string;retryAfter?:number};
  const status=failure.statusCode??500;
  if(status===429&&failure.retryAfter)reply.header('Retry-After',String(Math.max(1,failure.retryAfter)));
  if(status>=500){request.log.error({code:failure.code},'Request failed');return reply.code(503).send({error:'Service unavailable. Your current work has not been changed.'});}
  return reply.code(status).send({error:failure.message});
 });
 app.get('/api/health',()=>({status:'ok'}));
 app.get('/api/ready',async()=>{await pool.query('SELECT 1');return {status:'ready'};});
 const user=authModule(app,pool,config),storage=new PostgresAssetStorage(pool);assetModule(app,pool,user,storage);projectModule(app,pool,user,storage);
 return app;
}
