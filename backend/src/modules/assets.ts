import { createHash,randomUUID } from 'node:crypto';
import type { Pool,PoolClient } from 'pg';
import type { FastifyInstance,FastifyRequest } from 'fastify';
import { z } from 'zod';
import { imageDimensions } from '../security/images';
import type { User } from './auth';
export interface AssetStorage {put(client:PoolClient,id:string,bytes:Buffer):Promise<void>;get(id:string):Promise<Buffer|undefined>;getMany(ids:string[]):Promise<Map<string,Buffer>>}
export class PostgresAssetStorage implements AssetStorage {
 constructor(private pool:Pool){}
 async put(client:PoolClient,id:string,bytes:Buffer){await client.query('INSERT INTO asset_blobs(asset_id,bytes) VALUES($1,$2) ON CONFLICT(asset_id) DO UPDATE SET bytes=excluded.bytes',[id,bytes]);}
 async getMany(ids:string[]){const result=await this.pool.query<{asset_id:string;bytes:Buffer}>('SELECT asset_id,bytes FROM asset_blobs WHERE asset_id=ANY($1::uuid[])',[ids]);return new Map(result.rows.map(row=>[row.asset_id,row.bytes]));}
 async get(id:string){return (await this.pool.query<{bytes:Buffer}>('SELECT bytes FROM asset_blobs WHERE asset_id=$1',[id])).rows[0]?.bytes;}
}
export const sha256=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
export function imageBytes(data:string,mime:string){
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw Object.assign(new Error('Invalid image encoding'),{statusCode:400});
 const bytes=Buffer.from(data,'base64');
 const valid=mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const dimensions=valid?imageDimensions(bytes,mime):undefined;
 if(!valid||!dimensions||!dimensions.width||!dimensions.height||dimensions.width*dimensions.height>32000000||bytes.length>5000000||!bytes.length)throw Object.assign(new Error('Expected PNG or JPEG up to 5 MB and 32 megapixels'),{statusCode:400});
 return bytes;
}
export async function storeOwnedImage(client:PoolClient,owner:string,name:string,mime:string,bytes:Buffer,storage:AssetStorage){
 name=name.slice(0,255);
 await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[owner]);
 const existing=await client.query<{id:string}>('SELECT id FROM assets WHERE owner_id=$1 AND sha256=$2',[owner,sha256(bytes)]);
 if(existing.rows[0])return existing.rows[0].id;
 const usage=(await client.query<{bytes:string;count:string}>('SELECT coalesce(sum(size_bytes),0) AS bytes,count(*) AS count FROM assets WHERE owner_id=$1',[owner])).rows[0];
 if(Number(usage.bytes)+bytes.length>50000000||Number(usage.count)>=500)throw Object.assign(new Error('Account asset storage limit reached (50 MB / 500 uploads).'),{statusCode:413});
 const id=randomUUID();
 const result=await client.query<{id:string}>('INSERT INTO assets(id,owner_id,name,mime_type,size_bytes,sha256,storage_key) VALUES($1,$2,$3,$4,$5,$6,$1::uuid::text) ON CONFLICT(owner_id,sha256) WHERE owner_id IS NOT NULL DO UPDATE SET name=assets.name RETURNING id',[id,owner,name,mime,bytes.length,sha256(bytes)]);
 const saved=result.rows[0].id;
 await storage.put(client,saved,bytes);
 return saved;
}
export function assetModule(app:FastifyInstance,pool:Pool,user:(r:FastifyRequest)=>Promise<User>,storage:AssetStorage){
 type Catalog={assets:{id:string;key:string;mime:string;sha256:string;attribution:unknown;content:string}[]};
 let catalog:Catalog|undefined,cacheUntil=0,inflight:Promise<Catalog>|undefined;
 async function readCatalog():Promise<Catalog>{
  const result=await pool.query<{id:string;key:string;mime:string;sha256:string;attribution:unknown}>('SELECT id,logical_key AS key,mime_type AS mime,sha256,attribution FROM assets WHERE owner_id IS NULL ORDER BY logical_key');
  const bytes=await storage.getMany(result.rows.map(row=>row.id));
  return {assets:result.rows.map(row=>{const content=bytes.get(row.id);if(!content)throw new Error('Catalog asset bytes unavailable');return {...row,content:content.toString('utf8')};})};
 }
 app.get('/api/assets/catalog',async()=>{
  if(catalog&&Date.now()<cacheUntil)return catalog;
  inflight??=readCatalog().then(value=>{catalog=value;cacheUntil=Date.now()+60000;return value;}).finally(()=>{inflight=undefined;});
  return inflight;
 });
 app.get('/api/assets',async request=>{const account=await user(request);return {assets:(await pool.query('SELECT id,name,mime_type AS mime,size_bytes AS size,sha256,created_at FROM assets WHERE owner_id=$1 ORDER BY created_at DESC',[account.id])).rows};});
 app.post('/api/assets',{bodyLimit:6700000,config:{rateLimit:{max:20,timeWindow:'1 minute'}}},async(request,reply)=>{
  const account=await user(request),input=z.object({name:z.string().trim().min(1).max(255),mime:z.enum(['image/png','image/jpeg']),base64:z.string().max(6666668)}).strict().parse(request.body),bytes=imageBytes(input.base64,input.mime),client=await pool.connect();let id:string;
  try{await client.query('BEGIN');id=await storeOwnedImage(client,account.id,input.name,input.mime,bytes,storage);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  return reply.code(201).send({id,name:input.name,mime:input.mime,size:bytes.length,sha256:sha256(bytes)});
 });
 app.get('/api/assets/:id',async(request,reply)=>{
  const id=z.uuid().parse((request.params as {id:string}).id),result=await pool.query<{owner_id:string|null;mime_type:string;sha256:string}>('SELECT owner_id,mime_type,sha256 FROM assets WHERE id=$1',[id]),asset=result.rows[0];
  if(!asset)return reply.code(404).send({error:'Asset not found'});
  if(asset.owner_id&&(await user(request)).id!==asset.owner_id)return reply.code(404).send({error:'Asset not found'});
  const bytes=await storage.get(id);if(!bytes)return reply.code(503).send({error:'Asset bytes unavailable'});
  return reply.header('Content-Type',asset.mime_type).header('X-Content-Type-Options','nosniff').header('Cache-Control',asset.owner_id?'private, no-store':'public, max-age=3600').header('ETag',`"${asset.sha256}"`).send(bytes);
 });
 app.delete('/api/assets/:id',async(request,reply)=>{const account=await user(request),id=z.uuid().parse((request.params as {id:string}).id),result=await pool.query('DELETE FROM assets WHERE id=$1 AND owner_id=$2',[id,account.id]);return result.rowCount?{ok:true}:reply.code(404).send({error:'Asset not found'});});
}
