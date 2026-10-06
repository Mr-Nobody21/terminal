import { mkdirSync, readdirSync, copyFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

export function packageArgs(name, platform = process.platform, arch = process.arch) {
  const profiles = {
    windows: { host: 'win32', target: 'x86_64-pc-windows-msvc', bundles: 'nsis,msi' },
    linux: { host: 'linux', target: 'x86_64-unknown-linux-gnu', bundles: 'appimage,deb' },
    mac: { host: 'darwin', target: 'aarch64-apple-darwin', bundles: 'app,dmg' },
  };
  if (name === 'native') name = { win32: 'windows', linux: 'linux', darwin: 'mac' }[platform];
  const profile = profiles[name];
  if (!profile) throw Error(`Unsupported desktop build profile: ${name}`);
  if (platform !== profile.host) throw Error(`Build ${name} on a native ${name} runner. Use the Desktop installers workflow; this ${platform} host cannot use that native toolchain.`);
  if (arch !== (name === 'mac' ? 'arm64' : 'x64')) throw Error(`The ${name} packaging profile targets ${name === 'mac' ? 'Apple Silicon' : 'x64'}. Use a matching runner.`);
  return ['build', '--bundles', profile.bundles, '--target', profile.target, '--', '--locked'];
}

/** Collect only installers, never source maps, test builds, profiles or credentials. */
export function collectInstallers(bundle, destination) {
  const files = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !entry.name.endsWith('.app')) visit(path);
      else if (entry.isFile() && /\.(dmg|msi|exe|deb|AppImage)$/.test(entry.name)) files.push(path);
    }
  };
  visit(bundle);
  mkdirSync(destination, { recursive: true });
  for (const file of files) copyFileSync(file, resolve(destination, file.split(/[\\/]/).at(-1)));
  return files;
}

/** Platform overlays live with each app; the Rust shell remains shared. */
export function platformConfig(platform = process.platform) {
  const app = { darwin: 'mac', win32: 'windows', linux: 'linux' }[platform];
  if (!app) throw Error(`Unsupported desktop host: ${platform}`);
  return `apps/${app}/config/tauri.conf.json`;
}

/** Direct Cargo tests need the same overlay that the Tauri CLI passes to builds. */
export function cargoTestEnvironment(platform = process.platform) {
  const overlay = new URL(`../../../${platformConfig(platform)}`, import.meta.url);
  return { TAURI_CONFIG: readFileSync(overlay, 'utf8') };
}
