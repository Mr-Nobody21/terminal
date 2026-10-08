import { configuration } from './config';
import { database } from './db';
import { buildApp } from './app';
const config=configuration(),pool=database(config.databaseUrl),app=await buildApp(pool,config,true);
app.addHook('onClose',async()=>{await pool.end();});
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void app.close();});
try{await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');await app.listen({port:config.port,host:config.host});}catch{app.log.error('Backend startup failed. Check DATABASE_URL and run migrations.');await app.close();process.exitCode=1;}
