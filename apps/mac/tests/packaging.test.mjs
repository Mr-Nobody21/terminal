import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Mac app owns its app/DMG profile and ad-hoc signing policy', () => {
  const { bundle } = JSON.parse(readFileSync(new URL('../config/tauri.conf.json', import.meta.url), 'utf8'));
  assert.deepEqual(bundle.targets, ['app', 'dmg']);
  assert.equal(bundle.macOS.signingIdentity, '-');
  assert.equal(bundle.macOS.minimumSystemVersion, '13.0');
  assert.ok(bundle.icon.every(icon => icon.includes('apps/mac/assets/')));
});
