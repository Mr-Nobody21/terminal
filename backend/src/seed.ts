import { readdir,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { PostgresAssetStorage,sha256 } from './modules/assets';
export const assetsDirectory=fileURLToPath(new URL('../assets/',import.meta.url));
async function files(directory:string):Promise<string[]>{const entries=await readdir(directory,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${directory}/${e.name}`):Promise.resolve([`${directory}/${e.name}`])))).flat();}
export async function seedAssets(pool:Pool,directory=assetsDirectory){
 directory=directory.replace(/\/$/,'');
 const iconManifest:Record<string,string>=JSON.parse(await readFile(directory+'/icons/manifest.json','utf8')),extraManifest:{id:string;source:string;upstream?:string}[]=JSON.parse(await readFile(directory+'/drawing-assets/manifest.json','utf8'));
 const storage=new PostgresAssetStorage(pool),client=await pool.connect();let count=0;
 try{await client.query('BEGIN');for(const file of (await files(directory)).filter(f=>f.endsWith('.svg')).sort()){
  const key='/'+file.slice(directory.replace(/\/$/,'').length+1),bytes=await readFile(file),id=randomUUID();
  const result=await client.query<{id:string}>('INSERT INTO assets(id,logical_key,name,mime_type,size_bytes,sha256,storage_key,attribution) VALUES($1,$2,$3,\'image/svg+xml\',$4,$5,$1::uuid::text,$6) ON CONFLICT(logical_key) DO UPDATE SET size_bytes=excluded.size_bytes,sha256=excluded.sha256,attribution=excluded.attribution RETURNING id',[id,key,key.split('/').at(-1),bytes.length,sha256(bytes),JSON.stringify({documentation:'data/attribution/icons.md',sourcePath:`backend/assets${key}`,upstream:key.startsWith('/icons/')?iconManifest[key.slice(7,-4)]??'original project artwork':extraManifest.find(entry=>entry.id===key.slice(16,-4))??'original project artwork'})]);
  await storage.put(client,result.rows[0].id,bytes);count++;
 }await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}return count;
}
