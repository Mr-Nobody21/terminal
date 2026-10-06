# Windows and Linux desktop installers

The same Tauri/Rust application can now be packaged for Windows x64 and Linux x64. Canonical JSON, pricing and browser-local credentials are unchanged. No backend or release publishing is added.

| Platform | Command on that platform | Packages | Copied installers |
| --- | --- | --- | --- |
| Windows x64 | `npm run build:windows` | NSIS setup `.exe`, WiX `.msi` | `release/tauri/windows/` |
| Linux x64 | `npm run build:linux` | `.AppImage`, `.deb` | `release/tauri/linux/` |
| Apple Silicon Mac | `npm run build:mac` | `.app`, `.dmg` | DMG in `release/tauri/` |

`npm run build:desktop` chooses the matching native profile. The Windows/Linux commands intentionally fail on macOS before downloading or compiling incompatible toolchains. [Tauri recommends native runners](https://v2.tauri.app/distribute/pipelines/github/); its Windows MSI packaging requires Windows, and [NSIS cross-compilation has caveats](https://v2.tauri.app/distribute/windows-installer/). The Windows/Linux installers were generated and native-smoke-tested on GitHub runners; this Mac does not host Windows/Linux VMs.

## Native prerequisites

All platforms require Node.js 22.12+, npm, current stable Rust and the checked-in dependencies (`npm ci`). Windows requires Visual Studio Build Tools with Desktop development with C++, Windows SDK and WebView2. MSI packaging needs the VBScript optional Windows feature. See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

Windows installers are unsigned. If WebView2 is absent, the installer downloads Microsoft's bootstrapper; that initial setup requires internet access. Once installed, the manual planner workflow is local and works without credentials or network access.

Build Linux packages on Ubuntu 22.04 x64 with:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf xdg-utils libssl-dev xvfb
npm ci
npm run build:linux
```

On Linux, the application uses system WebKitGTK/GTK. The DEB declares native package dependencies through Tauri. AppImage users still need a compatible Linux desktop and may need FUSE or `--appimage-extract-and-run`. Newer/older distributions and ARM builds require their own compatibility verification. Building on Ubuntu 22.04 avoids accidentally requiring a newer build host's glibc.

## Native build workflow

[`.github/workflows/desktop-build.yml`](../../.github/workflows/desktop-build.yml) runs on relevant pushes to `feat/next-implementation`, with an additional manual trigger after the workflow exists on the default branch. It runs on Windows Server 2022 and Ubuntu 22.04 x64. It checks lint, unit tests, build-script tests, browser E2E and native smoke tests, then generates installers with the locked Cargo dependencies. Linux native tests use Xvfb with Openbox and software rendering. Normal release builds omit native-smoke test hooks.

The authorized implementation-branch push completed both jobs in [the verified run](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062) without merging into `main`. Inspect and download that run with:

```bash
gh run list --workflow desktop-build.yml
gh run watch 37518425062
gh run download 37518425062 --dir release/ci
```

The two downloadable run artifacts are `cloud-architecture-planner-windows-x64` and `cloud-architecture-planner-linux-x64`, retained for seven days. No GitHub Release, tag, deployment or updater is created. The workflow uses read-only repository permissions. Build outputs are ignored by Git.

## Implementation and validation

Changed: platform Tauri configurations, bundled ICO/PNG icons, native origin validation, portable Node CLI invocation, packaging scripts and tests, cross-platform isolated native smoke launcher, workflow and documentation. `packages/desktop/Cargo.lock` is retained; no schema or pricing migrations are needed. The Windows navigation policy permits only its actual `http://tauri.localhost` bundled origin, with the development origin restricted to debug builds. Mac/Linux retain `tauri://localhost`.

Run:

```bash
npm run lint
npm test -- --run
npm run build
npm run test:packaging
npm run test:e2e
npm run test:rust
npm run test:desktop
```

The native smoke suite checks two launches, persisted project edits, icons/diagram, absence of Node globals, and JSON/PNG/ZIP export contents. Windows/Linux use a temporary WebView data directory; macOS uses a separate test bundle identifier. Native save-panel interaction and installed-package startup still need a manual check on each new platform.

Build completion: source `5149c00` produced Windows EXE/MSI and Linux AppImage/DEB packages in [the successful workflow](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062). Both native suites passed two launches with persisted edits, icons, fullscreen and JSON/PNG/ZIP verification. The Mac app/DMG also rebuilt locally and passed signature/disk-image checks.

The initial Windows job exposed a missing platform overlay in direct Cargo tests. The launcher now passes the host configuration through `TAURI_CONFIG`; the regression is covered by the ninth packaging test. Full rerun checks passed: lint, 77 unit cases, 13 browser scenarios, 9 packaging checks, 4 Rust cases per OS, native smoke and installer generation. Downloaded artifacts and SHA-256 records are available under `release/tauri`.

Remaining checks concern interactive installed-package/save-dialog flows, signing if requested, and manual diagram importer compatibility. No GitHub Release, updater, hosted backend or deployment was added.
