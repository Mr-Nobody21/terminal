import { Pool } from 'pg';
import { createHash } from 'node:crypto';
import { readdir,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export function database(url:string){return new Pool({connectionString:url,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,statement_timeout:10000,idle_in_transaction_session_timeout:15000});}
export const migrationsDirectory=fileURLToPath(new URL('../migrations/',import.meta.url));
export async function migrate(pool:Pool,directory=migrationsDirectory){
 const client=await pool.connect();
 try {
  await client.query('SELECT pg_advisory_lock(19842026)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const name of (await readdir(directory)).filter(n=>/^\d+.*\.sql$/.test(n)).sort()){
   const sql=await readFile(`${directory}/${name}`,'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
   const existing=await client.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE name=$1',[name]);
   if(existing.rows.length){if(existing.rows[0].checksum!==checksum)throw new Error(`Migration checksum changed: ${name}`);continue;}
   await client.query('BEGIN');
   try{await client.query(sql);await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[name,checksum]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}
  }
 }finally{await client.query('SELECT pg_advisory_unlock(19842026)');client.release();}
}
