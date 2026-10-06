import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import JSZip from 'jszip';
import { join, resolve } from 'node:path';
const output = mkdtempSync(join(tmpdir(), 'planner-tauri-smoke-'));
const identifier = `com.cloudarchitectureplanner.smoke${Date.now()}`;
const bundling = process.platform === 'darwin' ? ['--bundles', 'app'] : ['--no-bundle'];
const command = spawnSync(process.execPath, ['tooling/scripts/build/tauri.mjs', 'build', '--debug', '--features', 'native-smoke', ...bundling, '--config', JSON.stringify({ identifier })], { env: process.env, stdio: 'inherit' });
if (command.status !== 0) process.exit(command.status ?? 1);
for (let attempt = 0; attempt < 2; attempt++) {
  const report = join(output, `launch-${attempt}.json`);
  const launched = spawnSync(resolve(process.platform === 'darwin' ? 'packages/desktop/target/debug/bundle/macos/Cloud Architecture Planner.app/Contents/MacOS/cloud-architecture-planner' : `packages/desktop/target/debug/cloud-architecture-planner${process.platform === 'win32' ? '.exe' : ''}`), [], {
    env: { ...process.env, PLANNER_SMOKE_REPORT: report, PLANNER_SMOKE_EXPORTS: output, PLANNER_SMOKE_PROFILE: join(output, 'profile') }, timeout: 45000, encoding: 'utf8',
  });
  if (launched.error || launched.status !== 0) throw Error(`Native smoke failed: ${launched.error ?? launched.stderr}`);
  const result = JSON.parse(readFileSync(report, 'utf8'));
  if (!result.ok || result.persisted !== (attempt === 1)) throw Error(JSON.stringify(result));
  console.log(`Native webview launch ${attempt + 1}: ${JSON.stringify(result)}`);
}
console.log(`Native smoke reports: ${output}`);

const files = readdirSync(output);
const exported = extension => readFileSync(join(output, files.find(name => name.endsWith(extension) && name.startsWith('Tauri native smoke'))));
const project = JSON.parse(exported('.json'));
if (!project.name.startsWith('Tauri native smoke')) throw Error('Unexpected native JSON');
if (exported('.png').subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error('Invalid native PNG');
const zip = await JSZip.loadAsync(exported('.zip'));
if (!zip.file('architecture.png') || !zip.file('architecture.json')) throw Error('Incomplete native ZIP');
console.log('Native JSON, PNG and ZIP export contents verified.');
