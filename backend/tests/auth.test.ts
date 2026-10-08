import { scryptSync } from 'node:crypto';
import { describe,it,expect } from 'vitest';
import { hashPassword,verifyPassword,tokenHash } from '../src/modules/auth';
import { imageBytes } from '../src/modules/assets';
import { imageDimensions } from '../src/security/images';
import { verifyDevelopmentOtp } from '../src/security/otp';
import { configuration } from '../src/config';
describe('authentication primitives',()=>{
 it('salts scrypt hashes and compares passwords',async()=>{const password='correct horse battery staple',a=await hashPassword(password),b=await hashPassword(password);expect(a).toMatch(/^scrypt-v2\$/);expect(a).not.toBe(b);expect(a).not.toContain(password);expect(await verifyPassword(password,a)).toBe(true);expect(await verifyPassword('wrong',a)).toBe(false);expect(await verifyPassword(password,'bad')).toBe(false);expect(tokenHash('secret')).toHaveLength(64);const salt=Buffer.alloc(16),legacy='scrypt-v1$'+salt.toString('hex')+'$'+scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:67108864}).toString('hex');expect(await verifyPassword(password,legacy)).toBe(true);});
 it('rejects wildcard origins and insecure cross-site cookies',()=>{expect(()=>configuration({DATABASE_URL:'postgresql://localhost/planner',CORS_ORIGINS:'*'})).toThrow();expect(()=>configuration({DATABASE_URL:'postgresql://localhost/planner',COOKIE_CROSS_SITE:'true'})).toThrow();expect(()=>configuration({DATABASE_URL:'postgresql://localhost/planner',NODE_ENV:'production'})).toThrow('OTP');expect(configuration({DATABASE_URL:'postgresql://localhost/planner',COOKIE_SECURE:'true'}).secureCookies).toBe(true);});
 it('accepts only the requested development code and rejects malformed hashes',async()=>{expect(verifyDevelopmentOtp('904530')).toBe(true);for(const code of ['000000','90453','9045300','abcdef'])expect(verifyDevelopmentOtp(code)).toBe(false);expect(await verifyPassword('password','scrypt-v1$aa$bb')).toBe(false);});
 it('bounds concurrent password hashing instead of queueing arbitrary work',async()=>{const jobs=await Promise.allSettled(Array.from({length:6},()=>hashPassword('a long password phrase')));expect(jobs.filter(job=>job.status==='fulfilled')).toHaveLength(4);expect(jobs.filter(job=>job.status==='rejected')).toHaveLength(2);});
 it('inspects PNG/JPEG dimensions without decoding and rejects image bombs',()=>{
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6X8AAAAASUVORK5CYII=','base64');expect(imageDimensions(png,'image/png')).toEqual({width:1,height:1});png.writeUInt32BE(100000,16);png.writeUInt32BE(100000,20);expect(()=>imageBytes(png.toString('base64'),'image/png')).toThrow('megapixels');
  const jpeg=Buffer.from([255,216,255,192,0,11,8,0,40,0,80,1,1,17,0,255,217]);expect(imageDimensions(jpeg,'image/jpeg')).toEqual({width:80,height:40});expect(imageDimensions(jpeg.subarray(0,8),'image/jpeg')).toBeUndefined();
 });
 it('rejects SVG uploads and mismatched image signatures',()=>{expect(()=>imageBytes(Buffer.from('<svg/>').toString('base64'),'image/svg+xml')).toThrow();expect(()=>imageBytes(Buffer.from('fake').toString('base64'),'image/png')).toThrow();expect(()=>imageBytes('!!!!!','image/png')).toThrow();});
});
