import { configuration } from './config';
import { database,migrate } from './db';
import { seedAssets } from './seed';
const pool=database(configuration().databaseUrl);
try{if(process.argv[2]==='migrate')await migrate(pool);else if(process.argv[2]==='seed')console.info(`Seeded ${await seedAssets(pool)} assets`);else throw new Error('Expected migrate or seed');}finally{await pool.end();}
