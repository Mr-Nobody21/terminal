# Linux application

This folder owns Linux configuration, assets, packaging policy and platform tests. Common React UI lives in `packages/ui`; the native shell lives in `packages/desktop`.

From the repository root, run `pnpm run build:linux` on the supported native host. Workspace-local `pnpm run build` invokes the same portable launcher. See [platform guidance](../../docs/platforms/linux.md).
