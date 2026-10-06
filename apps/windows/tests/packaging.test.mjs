import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Windows app owns NSIS/MSI packaging and current-user installation', () => {
  const { bundle } = JSON.parse(readFileSync(new URL('../config/tauri.conf.json', import.meta.url), 'utf8'));
  assert.deepEqual(bundle.targets, ['nsis', 'msi']);
  assert.equal(bundle.windows.nsis.installMode, 'currentUser');
  assert.equal(bundle.windows.webviewInstallMode.type, 'downloadBootstrapper');
  assert.ok(bundle.icon.every(icon => icon.includes('apps/windows/assets/')));
});
