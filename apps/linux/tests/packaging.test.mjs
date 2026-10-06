import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Linux app owns AppImage/DEB packaging and productivity metadata', () => {
  const { bundle } = JSON.parse(readFileSync(new URL('../config/tauri.conf.json', import.meta.url), 'utf8'));
  assert.deepEqual(bundle.targets, ['appimage', 'deb']);
  assert.equal(bundle.category, 'Productivity');
  assert.ok(bundle.icon.every(icon => icon.includes('apps/linux/assets/')));
});
