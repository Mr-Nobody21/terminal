# Current status

Updated 2026-10-07.

All requested desktop release builds are complete from source commit `5149c00`: Apple Silicon Mac app/DMG, Windows x64 NSIS EXE/MSI, and Linux x64 AppImage/DEB. Native Windows/Linux jobs passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062); their artifacts are downloaded locally. Mac built and verified locally.

Installers are in `release/tauri`, `release/tauri/windows` and `release/tauri/linux`. `release/tauri/BUILD_MANIFEST.json` records source, runner URL, byte sizes and SHA-256 digests; `SHA256SUMS.txt` provides checksums. The Mac app is under `packages/desktop/target/aarch64-apple-darwin/release/bundle/macos`.

Validation passed: clean npm install, lint, strict TypeScript/production build, 77 unit tests, 13 browser scenarios, 9 packaging checks, Rust tests and two-launch native smoke tests on all three operating systems. The native checks cover persistence, icons, fullscreen and JSON/PNG/ZIP exports. Mac signature/DMG checks pass; downloaded installer formats and Linux package metadata/payload were verified.

The codebase uses separate web/Windows/Mac/Linux app folders and shared UI/domain/adapters/Rust packages. Project version 1 and browser storage are unchanged. Backend remains reserved documentation only. Source and the Windows test-overlay fix were pushed to `feat/next-implementation` as authorized for these builds; no main merge, hosted deployment or GitHub Release was created.

Remaining manual checks: installed-package/save-dialog interaction, representative Draw.io/Visio imports and production signing/notarization if distribution is requested. Windows is unsigned; Mac uses ad-hoc signing and is not notarized.

See [structure](../docs/architecture/codebase-structure.md), [required infrastructure](../infra/REQUIRED_INFRA.md), [validation](validation.md), [known issues](known-issues.md) and [handoff history](handoffs/implementation.md).
