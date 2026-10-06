# macOS application

This folder owns macOS configuration, assets, packaging policy and platform tests. Common React UI lives in `packages/ui`; the native shell lives in `packages/desktop`.

From the repository root, run `npm run build:mac` on the supported native host. Workspace-local `npm run build` invokes the same portable launcher. See [platform guidance](../../docs/platforms/mac.md).
