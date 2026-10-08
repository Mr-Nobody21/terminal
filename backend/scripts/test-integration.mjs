import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const url=process.env.TEST_DATABASE_URL??process.env.DATABASE_URL;
if(!url){console.error('TEST_DATABASE_URL or DATABASE_URL is required for PostgreSQL integration tests.');process.exitCode=1;}
else {process.exitCode=spawnSync(process.execPath,[join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs'),'run','--config','vitest.config.ts'],{stdio:'inherit',env:{...process.env,TEST_DATABASE_URL:url}}).status??1;}
