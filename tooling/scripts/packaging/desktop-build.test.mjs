import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packageArgs, collectInstallers } from './desktop-build.mjs';

test('Windows and Linux use matching native x64 toolchains and locked dependencies', () => {
  assert.deepEqual(packageArgs('windows', 'win32', 'x64'), ['build', '--bundles', 'nsis,msi', '--target', 'x86_64-pc-windows-msvc', '--', '--locked']);
  assert.deepEqual(packageArgs('linux', 'linux', 'x64'), ['build', '--bundles', 'appimage,deb', '--target', 'x86_64-unknown-linux-gnu', '--', '--locked']);
  assert.deepEqual(packageArgs('native', 'darwin', 'arm64'), packageArgs('mac', 'darwin', 'arm64'));
});
test('unsupported hosts fail before trying to compile or download toolchains', () => {
  assert.throws(() => packageArgs('windows', 'darwin', 'arm64'), /native windows runner/);
  assert.throws(() => packageArgs('linux', 'darwin', 'arm64'), /native linux runner/);
  assert.throws(() => packageArgs('linux', 'linux', 'arm64'), /matching runner/);
  assert.throws(() => packageArgs('unknown', 'linux', 'x64'), /Unsupported/);
});
test('artifact collection preserves binary bytes and excludes app contents and unrelated files', () => {
  const root = mkdtempSync(join(tmpdir(), 'planner-packaging-'));
  const bundle = join(root, 'bundle'), output = join(root, 'output');
  for (const folder of ['nsis', 'msi', 'deb', 'appimage', 'macos/Planner.app']) mkdirSync(join(bundle, folder), { recursive: true });
  const files = ['nsis/planner-setup.exe', 'msi/planner.msi', 'deb/planner.deb', 'appimage/planner.AppImage'];
  for (const file of files) writeFileSync(join(bundle, file), Buffer.from([0, 1, 255]));
  writeFileSync(join(bundle, 'nsis/debug.json'), 'private test data');
  writeFileSync(join(bundle, 'macos/Planner.app/helper.exe'), 'not an installer');
  assert.equal(collectInstallers(bundle, output).length, 4);
  assert.equal(readdirSync(output).length, 4);
  for (const file of readdirSync(output)) assert.deepEqual(readFileSync(join(output, file)), Buffer.from([0, 1, 255]));
});

test('platform overlays and frontend distribution resolve from the shared Rust shell', async () => {
  const { platformConfig } = await import('./desktop-build.mjs');
  const root = new URL('../../../', import.meta.url);
  const shell = new URL('packages/desktop/', root);
  const config = JSON.parse(readFileSync(new URL('tauri.conf.json', shell), 'utf8'));
  assert.equal(new URL(`${config.build.frontendDist}/`, shell).href, new URL('apps/web/dist/', root).href);
  for (const host of ['darwin', 'win32', 'linux']) {
    const overlay = JSON.parse(readFileSync(new URL(platformConfig(host), root), 'utf8'));
    for (const icon of overlay.bundle.icon) {
      assert.ok(readFileSync(new URL(icon, shell)).length > 0);
    }
  }
  assert.throws(() => platformConfig('unsupported'), /Unsupported desktop host/);
});

test('workspace manifests expose real source entries and declare dependency direction', () => {
  const root = new URL('../../../', import.meta.url);
  for (const name of ['ui', 'domain', 'adapters']) {
    const directory = new URL(`packages/${name}/`, root);
    const manifest = JSON.parse(readFileSync(new URL('package.json', directory), 'utf8'));
    for (const source of Object.values(manifest.exports)) assert.ok(readFileSync(new URL(source, directory)).length > 0);
    if (name === 'domain') {
      assert.ok(!manifest.dependencies['@planner/ui']);
      assert.ok(!manifest.dependencies['@planner/adapters']);
    }
    if (name === 'adapters') assert.ok(!manifest.dependencies['@planner/ui']);
  }
});
