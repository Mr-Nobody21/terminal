# Linux packaging

The authoritative packaging settings are in `../config/tauri.conf.json`. The shared launcher merges them into `packages/desktop/tauri.conf.json` and collects installers under `release/tauri`.

Keep custom installer scripts in this folder when needed. Configuration tests in `../tests` verify the checked-in profile; native and installed-package acceptance checks require a matching host. Signing policy is documented in [release signing](../../../infra/release-signing.md).
