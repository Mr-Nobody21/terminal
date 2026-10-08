import { z } from 'zod';
export interface Config { databaseUrl:string; port:number; host:string; origins:string[]; secureCookies:boolean; crossSiteCookies:boolean; sessionSeconds:number; production:boolean }
export function configuration(env:NodeJS.ProcessEnv=process.env):Config {
 const e=z.object({DATABASE_URL:z.string().url(),PORT:z.coerce.number().int().min(1).max(65535).default(3001),HOST:z.string().default('127.0.0.1'),CORS_ORIGINS:z.string().default('http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'),NODE_ENV:z.enum(['development','test','production']).default('development'),COOKIE_SECURE:z.enum(['true','false']).optional(),COOKIE_CROSS_SITE:z.enum(['true','false']).default('false'),SESSION_SECONDS:z.coerce.number().int().min(60).max(2592000).default(604800)}).parse(env);
 const production=e.NODE_ENV==='production';
 if(production)throw new Error('Fixed development OTP cannot run in production. Configure a real second-factor provider before deployment.');
 const secureCookies=e.COOKIE_SECURE==='true'||production;
 if(e.COOKIE_CROSS_SITE==='true'&&!secureCookies) throw new Error('Cross-site cookies require COOKIE_SECURE=true and HTTPS');
 const origins=e.CORS_ORIGINS.split(',').map(s=>s.trim()).filter(Boolean);
 if(!origins.length||origins.some(o=>{if(o==='tauri://localhost')return false;try{const url=new URL(o);return !['http:','https:'].includes(url.protocol)||url.origin!==o||!!url.username||!!url.password;}catch{return true;}})) throw new Error('Explicit CORS origins are required');
 return {databaseUrl:e.DATABASE_URL,port:e.PORT,host:e.HOST,origins,secureCookies,crossSiteCookies:e.COOKIE_CROSS_SITE==='true',sessionSeconds:e.SESSION_SECONDS,production};
}
