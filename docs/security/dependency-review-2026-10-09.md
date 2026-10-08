# Node dependency review — 2026-10-09

## Result and scope

The initial npm audit and final pnpm audit both reported **zero known advisories**, across every workspace and direct/transitive runtime, development and optional dependencies. No advisory ignores or severity exclusions were applied. There were no vulnerable packages requiring a forced replacement. This is an advisory scan and dependency/configuration review, not a source-code audit of every third-party module or a guarantee against undisclosed vulnerabilities.

The final audit reports 476 dependency entries (122 production, 339 development and 107 optional; categories overlap). The normalized [inventory](dependency-inventory-2026-10-09.json) records 461 distinct package/version pairs across the resolved workspace tree, including platform-specific optional packages. The [machine-readable audit](dependency-audit-2026-10-09.json) preserves the registry result. Package integrity hashes and exact resolutions are in `pnpm-lock.yaml`.

## Changes

- Replaced npm workspace installation/build/deployment commands with pinned **pnpm 12.10.1**, its workspace file and a single pnpm lockfile. The superseded npm lockfile was removed from the checkout and preserved as an ignored local backup.
- Refreshed dependencies within supported manifest ranges; DOCX moved from 9.8.1 to 9.9.0. Replaced deprecated ESLint 9.39.5 with 10.12.0, its matching config package 10.0.1, and globals 17.13.0. Updated error wrapping for the new lint rule and verified AI failure behavior with existing tests.
- Kept supported existing majors for React, Vite, Vitest, TypeScript, layout and report libraries where no advisory warranted a breaking migration. A newer major alone does not establish a security fix. Node types continue to match the supported Node 22 runtime.
- Added strict peer validation, store-integrity verification, a 24-hour release-age window, and an install-script allowlist limited to esbuild. Three already audited Fastify versions have exact release-age exceptions: cookie 11.1.3, cors 11.3.1 and rate-limit 11.2.1. There is no broad age-window bypass.
- CI installs the frozen lockfile and performs full advisory scans plus application tests on pushes, pull requests, manual runs and weekly. Registry errors fail the command. Desktop workflows and Tauri hooks also use pnpm.
- Release preparation runs frozen install, full audit and all application checks, then uses pnpm production-only packaging. Backend management commands are compiled, so migration/seed operations do not need tsx or TypeScript in deployment artifacts. Credentials are excluded and existing artifacts are never overwritten.

## Verification

`pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test --run` (117), backend unit tests (6; database suite skipped without an explicit test URL), `pnpm test:backend:integration` (21), `pnpm build`, `pnpm test:e2e` (27), packaging tests (9), deployment tests (4), and actual portable artifact preparation passed. Production preflight was exercised against the packaged configuration and failed with the expected fixed-OTP blocker before writes or startup.

Native installers were not rebuilt or revalidated by this task. Existing desktop authentication smoke-fixture limitations remain. Build warnings about large ELK/report bundles and upstream Zod annotations remain nonfatal. No hosting destination was selected and no deployment was performed. Real MFA and the production requirements in [deployment operations](../../infra/deployment/README.md) remain mandatory.

## Repeat the review

```sh
pnpm install --frozen-lockfile
pnpm audit --audit-level low
pnpm audit --json
pnpm list --recursive --depth Infinity --json
pnpm outdated --recursive
pnpm run check
pnpm run test:backend:integration
```

Review advisories and release notes before targeted upgrades; rerun the relevant tests. Do not suppress unresolved advisories or use blanket forced major upgrades. Regenerate the dated inventory and audit evidence after dependency changes. Optional platform packages are resolved/audited but only installed and executed on matching operating systems.

Primary references: [pnpm installation and platform support](https://pnpm.io/installation), [pnpm advisory audits](https://pnpm.io/cli/audit), [workspace and supply-chain settings](https://pnpm.io/settings), and [portable production packaging](https://pnpm.io/cli/deploy).
