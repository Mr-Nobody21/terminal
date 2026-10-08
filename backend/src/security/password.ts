import { randomBytes,scrypt,timingSafeEqual } from 'node:crypto';
// Fail fast instead of queueing unlimited expensive jobs in Node's worker pool.
let activeHashes=0;
async function derive(password:string,salt:Buffer,parallelism=3):Promise<Buffer>{
 if(activeHashes>=4)throw Object.assign(new Error('Authentication is busy. Try again shortly.'),{statusCode:429,retryAfter:1});
 activeHashes++;
 try{return await new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:32768,r:8,p:parallelism,maxmem:67108864},(error,key)=>error?reject(error):resolve(key)));}
 finally{activeHashes--;}
}
export async function hashPassword(password:string){
 const salt=randomBytes(16);
 return `scrypt-v2$${salt.toString('hex')}$${(await derive(password,salt)).toString('hex')}`;
}
export async function verifyPassword(password:string,hash:string){
 if(!/^scrypt-v[12]\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash))return false;
 const [version,salt,encoded]=hash.split('$');
 return timingSafeEqual(await derive(password,Buffer.from(salt,'hex'),version==='scrypt-v1'?1:3),Buffer.from(encoded,'hex'));
}
