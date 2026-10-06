# Windows app

`apps/windows` owns Windows Tauri configuration, ICO assets and installer policy; it consumes the shared UI/Rust shell. Build on Windows x64 with root `npm run build:windows`.

The profile produces NSIS EXE/MSI installers under `release/tauri/windows`. See [desktop builds](desktop-builds.md) and [required infrastructure](../../infra/REQUIRED_INFRA.md). Native Windows builds remain pending; configuration tests do not establish installer compatibility.
