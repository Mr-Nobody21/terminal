import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkArtifacts, prepare, productionCheck } from './deploy.mjs';
test('missing artifacts fail before deployment', () => {
 assert.throws(() => checkArtifacts(mkdtempSync(join(tmpdir(), 'planner-release-'))), /Missing deployment artifact/);
});
test('existing releases are never overwritten and no commands run', () => {
 const directory = mkdtempSync(join(tmpdir(), 'planner-release-'));
 assert.throws(() => prepare(directory, () => assert.fail('must not execute')), /Output already exists/);
});
test('release checks reject accidentally packaged credentials', () => {
 const directory = mkdtempSync(join(tmpdir(), 'planner-release-'));
 for (const path of ['web/index.html','backend/dist/server.js','backend/dist/manage.js','backend/dist/config.js','backend/migrations/004_auth_security.sql','backend/assets/icons/manifest.json','backend/node_modules/fastify/package.json']) {
  const target = join(directory, path);mkdirSync(join(target, '..'), { recursive: true });writeFileSync(target, '');
 }
 checkArtifacts(directory);writeFileSync(join(directory, 'backend/.env'), 'secret');assert.throws(() => checkArtifacts(directory), /Credentials/);
});
test('production preflight uses the packaged configuration and forces production mode', async () => {
 const directory = mkdtempSync(join(tmpdir(), 'planner-release-'));
 for (const path of ['web/index.html','backend/dist/server.js','backend/dist/manage.js','backend/dist/config.js','backend/migrations/004_auth_security.sql','backend/assets/icons/manifest.json','backend/node_modules/fastify/package.json']) {
  const target = join(directory, path);mkdirSync(join(target, '..'), { recursive: true });writeFileSync(target, '');
 }
 writeFileSync(join(directory, 'backend/package.json'), '{"type":"module"}');
 writeFileSync(join(directory, 'backend/dist/config.js'), "export function configuration(env) { if (env.NODE_ENV === 'production') throw new Error('Fixed development OTP cannot run in production'); }");
 await assert.rejects(productionCheck(directory, { NODE_ENV: 'development' }), /Fixed development OTP/);
});
