import type { FastifyInstance,FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { z } from 'zod';
import { parseProject } from '../../../packages/domain/src/model/index';
import { parseDrawing } from '../../../packages/domain/src/drawings/model';
import { imageBytes,storeOwnedImage,type AssetStorage } from './assets';
import type { User } from './auth';
function validated<T>(parse:()=>T):T{try{return parse();}catch(error){throw Object.assign(error instanceof Error?error:new Error('Invalid project'),{statusCode:400});}}
export function projectModule(app:FastifyInstance,pool:Pool,user:(r:FastifyRequest)=>Promise<User>,storage:AssetStorage){
 app.get('/api/projects',async request=>{const account=await user(request);return {projects:(await pool.query('SELECT id,document->>\'name\' AS name,revision,updated_at FROM projects WHERE owner_id=$1 ORDER BY updated_at DESC',[account.id])).rows};});
 app.get('/api/projects/:id',async(request,reply)=>{const account=await user(request),id=z.uuid().parse((request.params as {id:string}).id),result=await pool.query('SELECT document,drawings,revision FROM projects WHERE owner_id=$1 AND id=$2',[account.id,id]);return result.rows[0]??reply.code(404).send({error:'Project not found'});});
 app.put('/api/projects/:id',{config:{rateLimit:{max:60,timeWindow:'1 minute'}}},async(request,reply)=>{
  const account=await user(request),id=z.uuid().parse((request.params as {id:string}).id),input=z.object({document:z.unknown(),drawings:z.array(z.unknown()).max(20),revision:z.number().int().min(0)}).strict().parse(request.body),document=validated(()=>parseProject(input.document)),drawings=validated(()=>input.drawings.map(parseDrawing));
  if(document.id!==id||drawings.some(d=>d.projectId!==id)||new Set(drawings.map(d=>d.id)).size!==drawings.length||new Set(drawings.map(d=>d.kind)).size!==drawings.length)throw Object.assign(new Error('Project/drawing references do not match'),{statusCode:400});
  const client=await pool.connect();
  try{await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[account.id]);
  if(input.revision===0){const existing=await client.query('SELECT 1 FROM projects WHERE owner_id=$1 AND id=$2',[account.id,id]);const count=await client.query<{count:string}>('SELECT count(*) FROM projects WHERE owner_id=$1',[account.id]);if(!existing.rowCount&&Number(count.rows[0].count)>=100)throw Object.assign(new Error('Account project limit reached (100 projects).'),{statusCode:413});}
  const result=input.revision===0?await client.query('INSERT INTO projects(id,owner_id,document,drawings) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING revision',[id,account.id,JSON.stringify(document),JSON.stringify(drawings)]):await client.query('UPDATE projects SET document=$3,drawings=$4,revision=revision+1,updated_at=now() WHERE id=$1 AND owner_id=$2 AND revision=$5 RETURNING revision',[id,account.id,JSON.stringify(document),JSON.stringify(drawings),input.revision]);
  if(!result.rows[0]){await client.query('ROLLBACK');return reply.code(409).send({error:'Project changed in another session. Reload before saving.'});}
  await client.query('DELETE FROM project_assets WHERE owner_id=$1 AND project_id=$2',[account.id,id]);
  for(const drawing of drawings)for(const node of drawing.nodes){if(!node.imageData)continue;const [header,data]=node.imageData.split(','),mime=header.slice(5).split(';')[0],bytes=imageBytes(data,mime),assetId=await storeOwnedImage(client,account.id,node.label,mime,bytes,storage);await client.query('INSERT INTO project_assets(owner_id,project_id,asset_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[account.id,id,assetId]);}
  await client.query('COMMIT');return result.rows[0];
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 });
 app.delete('/api/projects/:id',async(request,reply)=>{const account=await user(request),id=z.uuid().parse((request.params as {id:string}).id),result=await pool.query('DELETE FROM projects WHERE id=$1 AND owner_id=$2',[id,account.id]);return result.rowCount?{ok:true}:reply.code(404).send({error:'Project not found'});});
}
