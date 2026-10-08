import { spawnSync } from 'node:child_process';
import { mkdirSync, cpSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
export const root = fileURLToPath(new URL('../../../', import.meta.url));
export function command(command, args, cwd = root, env = process.env) {
  const executable = command === 'pnpm' ? env.npm_execpath || 'pnpm' : command;
  const javascript = /\.[cm]?js$/.test(executable);
  // pnpm 12 supplies a native executable; never interpolate paths into a shell.
  const result = spawnSync(javascript ? process.execPath : executable, javascript ? [executable, ...args] : args, { cwd, env, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
export function checkArtifacts(directory) {
  for (const path of ['web/index.html', 'backend/dist/server.js', 'backend/dist/manage.js', 'backend/dist/config.js', 'backend/migrations/004_auth_security.sql', 'backend/assets/icons/manifest.json', 'backend/node_modules/fastify/package.json']) {
    if (!existsSync(resolve(directory, path))) throw new Error(`Missing deployment artifact: ${path}`);
  }
  if (existsSync(resolve(directory, 'backend/.env'))) throw new Error('Credentials must not be packaged');
}
export async function productionCheck(directory, env = process.env) {
  checkArtifacts(directory);
  const module = await import(pathToFileURL(resolve(directory, 'backend/dist/config.js')).href);
  // Uses the application's actual configuration validation, including its MFA gate.
  module.configuration({ ...env, NODE_ENV: 'production' });
}
export function prepare(directory, run = command) {
  if (existsSync(directory)) throw new Error('Output already exists; choose a new directory to preserve previous releases.');
  run('pnpm', ['install', '--frozen-lockfile']);
  run('pnpm', ['audit', '--audit-level', 'low']);
  run('pnpm', ['run', 'check']);
  mkdirSync(directory, { recursive: true });
  cpSync(resolve(root, 'apps/web/dist'), resolve(directory, 'web'), { recursive: true });
  run('pnpm', ['--filter', '@planner/backend', 'deploy', '--prod', '--legacy', '--frozen-lockfile', resolve(directory, 'backend')]);
  checkArtifacts(directory);
  cpSync(resolve(root, 'infra/deployment'), resolve(directory, 'operations'), { recursive: true });
  writeFileSync(resolve(directory, 'RELEASE.json'), JSON.stringify({ createdAt: new Date().toISOString(), node: process.version, packageManager: 'pnpm@12.10.1', productionReady: false, blocker: 'Replace fixed development OTP with real MFA before production.' }, null, 2));
  console.info(`Prepared ${directory}. Production startup remains blocked until real MFA is implemented.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directory = resolve(process.argv[3] || 'release/deployment');
    if (process.argv[2] === 'prepare') prepare(directory);
    else if (process.argv[2] === 'check') await productionCheck(directory);
    else if (['start', 'migrate'].includes(process.argv[2])) {
      await productionCheck(directory);
      const env = { ...process.env, NODE_ENV: 'production' };
      const cwd = resolve(directory, 'backend');
      if (process.argv[2] === 'migrate') {
        command(process.execPath, ['dist/manage.js', 'migrate'], cwd, env);
        command(process.execPath, ['dist/manage.js', 'seed'], cwd, env);
      } else command(process.execPath, ['dist/server.js'], cwd, env);
    }
    else throw new Error('Usage: pnpm deploy:prepare [new-output-directory] | pnpm deploy:check [directory] | pnpm deploy:migrate [directory] | pnpm deploy:start [directory]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
