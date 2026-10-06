# Windows app

`apps/windows` owns Windows Tauri configuration, ICO assets and installer policy; it consumes the shared UI/Rust shell. Build on Windows x64 with root `npm run build:windows`.

The profile produces NSIS EXE/MSI installers under `release/tauri/windows`. See [desktop builds](desktop-builds.md) and [required infrastructure](../../infra/REQUIRED_INFRA.md). Windows x64 release builds and the two-launch native smoke suite passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062). Interactive installed-package checks remain manual.
