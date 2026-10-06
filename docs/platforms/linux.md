# Linux app

`apps/linux` owns Linux Tauri configuration, PNG assets and package policy; it consumes the shared UI/Rust shell. Build on Linux x64 with root `npm run build:linux`.

The profile produces AppImage/DEB packages under `release/tauri/linux`. See [desktop builds](desktop-builds.md) and [required infrastructure](../../infra/REQUIRED_INFRA.md). Linux x64 release builds and the two-launch native smoke suite passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062). Interactive installed-package checks remain manual.
