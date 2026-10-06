# Linux app

`apps/linux` owns Linux Tauri configuration, PNG assets and package policy; it consumes the shared UI/Rust shell. Build on Linux x64 with root `npm run build:linux`.

The profile produces AppImage/DEB packages under `release/tauri/linux`. See [desktop builds](desktop-builds.md) and [required infrastructure](../../infra/REQUIRED_INFRA.md). Native Linux builds remain pending; configuration tests do not establish installer compatibility.
