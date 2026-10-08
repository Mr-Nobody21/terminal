# Rust Mac desktop build

The desktop shell now uses Tauri 2 and Rust with macOS WKWebView. Electron and its dependencies have been removed. The existing React application, canonical project version, pricing calculations and static browser build are preserved. No backend or native AI proxy is introduced.

## Build and launch

Requires macOS 13+, Xcode Command Line Tools, a current stable Rust toolchain, Node.js 22.20+ or 24 LTS and pnpm 12.10.1. This build targets Apple Silicon.

```bash
pnpm install --frozen-lockfile
pnpm run desktop
pnpm run build:mac
```

Artifacts:

- `packages/desktop/target/aarch64-apple-darwin/release/bundle/macos/Cloud Architecture Planner.app`
- `release/tauri/Cloud Architecture Planner_0.1.0_aarch64.dmg`

The packaging script also leaves the original DMG under the target bundle directory. Open the DMG and drag the app to Applications. The build does not install, publish or upload the app. Previous Electron artifacts under `release/` are superseded and are not the new Rust build.

The app is locally ad-hoc signed, without Developer ID credentials or notarization. External distribution would require a separate Apple signing/notarization step. Intel/universal artifacts are not produced by this command. See [Tauri macOS distribution](https://v2.tauri.app/distribute/macos/).

This workspace has ignored local toolchains. `tooling/scripts/build/tauri.mjs` automatically selects `.runtime/cargo` and `.runtime/rustup` when available. Prepend `.runtime/bin` to PATH for the local Node installation. No global Rust or Node configuration is changed.

## Storage, credentials and native permissions

Bundled static assets use `tauri://localhost`. macOS WebKit manages persistent IndexedDB for the application identifier `com.cloudarchitectureplanner.desktop`. Hash routes remain supported. Projects autosave locally. Keys remain in React memory and reset when the app closes; endpoint/model preferences persist separately. AI requests are direct browser requests, start only after submission and retain provider CORS restrictions.

WebKit and Electron/Chromium have different storage engines. Export project JSON from the old Electron app or browser and import it into the Rust app. The old Electron profile is not deleted or automatically migrated. JSON remains canonical version 1.

The renderer has no Node APIs and no filesystem/shell plugin permissions. Its export command accepts bounded export bytes and a basename. Fullscreen commands read/toggle only the invoking native window. Rust shows a native save dialog and writes only to the selected path; cancellation leaves the project unchanged and write failures are displayed. Supported exports are JSON, Draw.io, SVG, PNG, PDF, Markdown, DOCX and ZIP, with a 128 MiB native export limit. HTTPS pricing links open in the system browser; remote top-level navigation is denied. CSP permits direct HTTPS requests and localhost HTTP model endpoints.

## Source and verification

- `packages/desktop/`: locked Rust dependencies, native lifecycle, navigation policy, export validation, Tauri packaging and capability configuration.
- `packages/adapters/src/platform/download.ts`: native save bridge with the existing browser download fallback; `packages/ui/src/app/useWorkspace.ts` handles export errors.
- `tooling/scripts/build/tauri.mjs`: local toolchain selection and app/DMG build commands.
- `tooling/scripts/testing/native-smoke.mjs`, `packages/desktop/src/smoke.js`: actual macOS WKWebView acceptance tests.
- `packages/adapters/src/platform/download.test.ts`: bridge bytes, cancellation, errors and browser download regression tests.
- `apps/mac/assets/mac-icon.icns`, `apps/mac/assets/icon.png`, `tooling/scripts/packaging/make-mac-icon.py`: bundled brand icon, no runtime icon download.

```bash
pnpm run lint
pnpm test --run
pnpm run build
pnpm run test:e2e
pnpm run test:desktop
```

The desktop suite runs Rust validation tests and builds a separate `native-smoke` feature with an isolated test application identifier. It launches WKWebView twice, checks diagram/icons, secure origin, native APIs, project persistence, and JSON/PNG/ZIP export contents. Test-only report/export bypass commands are compiled out of normal builds. Generated smoke profiles remain separate from normal projects. This is a native smoke suite, not macOS WebDriver automation; [Tauri does not provide macOS WebDriver support](https://v2.tauri.app/develop/tests/webdriver/). Native save-panel interaction requires a manual check; automated tests verify cancellation/error handling and the underlying export bridge without operating the panel.

Known MVP limits remain: bounded pricing catalogs, manual Draw.io/Visio importer compatibility checks pending, and PDF standard-font Unicode substitution. No schema or pricing formula changes were made in this migration.

## Migration handoff — 2026-10-06

Passed: ESLint; 59 Vitest tests; strict TypeScript/static build; all 7 browser E2E cases; 2 Rust unit tests; Clippy with warnings denied; two actual WKWebView launches with project recovery, bundled icons and JSON/PNG/ZIP content checks. npm dependency audit reports zero vulnerabilities. Release packaging produces approximately 15.33 MiB for the app and 3.74 MiB for the DMG. Existing large frontend chunk and third-party annotation warnings remain non-fatal.

The next local check is manually selecting/cancelling a native export save dialog and representative Draw.io/Visio imports. Developer ID signing/notarization is a separate step if distribution is later requested. All changes remain local on `feat/next-implementation`.

Final artifact checks passed: ARM64 Mach-O, `codesign --verify --deep --strict`, DMG checksum verification, absence of native-smoke hooks in the production executable, and `git diff --check`.

Windows/Linux packaging is now prepared separately; see [desktop builds](desktop-builds.md). `pnpm run build:desktop` now selects the native platform, while `pnpm run build:mac` retains Apple Silicon app/DMG output.

The header Full screen button uses native fullscreen in the desktop app and provides an Exit full screen control. F11 toggles the same control when delivered to the app. The normal macOS green window control and Control-Command-F menu shortcut remain available. Fullscreen uses the full workspace width and additional viewport height for the diagram.
