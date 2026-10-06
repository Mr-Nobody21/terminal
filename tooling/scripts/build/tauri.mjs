import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageArgs, collectInstallers, platformConfig } from '../packaging/desktop-build.mjs';

// Derive paths from this file so workspace scripts work from any app directory.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const desktop = resolve(root, 'packages/desktop');
const env = { ...process.env, TAURI_APP_PATH: desktop, TAURI_FRONTEND_PATH: root };
if (existsSync(resolve(root, `.runtime/cargo/bin/cargo${process.platform === 'win32' ? '.exe' : ''}`))) {
  env.CARGO_HOME = resolve(root, '.runtime/cargo');
  env.RUSTUP_HOME = resolve(root, '.runtime/rustup');
  env.PATH = `${resolve(root, '.runtime/cargo/bin')}${delimiter}${env.PATH}`;
}
const run = (command, args) => {
  const result = spawnSync(command, args, { env, cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
let args = process.argv.slice(2);
if (args[0] === 'package') {
  try { args = packageArgs(args[1]); }
  catch (error) { console.error(error.message); process.exit(1); }
}
if (args[0] === 'test' || args[0] === 'rust-test') {
  run('cargo', ['test', '--manifest-path', resolve(desktop, 'Cargo.toml')]);
  if (args[0] === 'test') run(process.execPath, [resolve(root, 'tooling/scripts/testing/native-smoke.mjs')]);
} else {
  if (args[0] === 'build' || args[0] === 'dev') {
    args = [args[0], '--config', resolve(root, platformConfig()), ...args.slice(1)];
  }
  run(process.execPath, [resolve(root, 'node_modules/@tauri-apps/cli/tauri.js'), ...args]);
  if (args[0] === 'build' && !args.includes('--help') && !args.includes('-h')) {
    const targetAt = args.indexOf('--target');
    const target = targetAt < 0 ? '' : args[targetAt + 1];
    const bundle = resolve(desktop, 'target', target, args.includes('--debug') ? 'debug/bundle' : 'release/bundle');
    if (existsSync(bundle) && !args.includes('--debug')) {
      const destination = resolve(root, 'release/tauri', process.platform === 'darwin' ? '' : process.platform === 'win32' ? 'windows' : 'linux');
      collectInstallers(bundle, destination);
    }
    console.log(`Native bundles: ${bundle}`);
  }
}
