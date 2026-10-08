# Current status

Updated 2026-10-09.

The latest security pass adds a password → OTP login/registration step with requested development code `904530`, expiring single-use challenges, persistent auth throttles, rate limits, stronger versioned password hashing, session limits, security headers/audit/quotas and asset caching. Fixed-code mode is deliberately blocked in production; enrolled MFA remains a future integration. Validation passes: 117 shared tests, 21 backend/SQL tests, 27 browser scenarios, builds and nine packaging checks; dependency audit reports zero vulnerabilities. See [OTP/security handoff](handoffs/otp-and-security-hardening.md) and [review](../docs/security/review-2026-10-09.md).

Latest source now includes a separate Fastify/PostgreSQL backend, email/password authentication, a disabled Google sign-in button, user-owned account snapshots, and database-backed runtime icons/uploads. Three migrations and 61 SVG seeds were applied to the local PostgreSQL database. The UI requires the backend for login/assets; local recovery remains account scoped. See [backend handoff](handoffs/authenticated-backend.md) and [setup](../backend/README.md). Lint, 115 unit tests, 11 backend/SQL tests, browser workflows, UI/server build and nine packaging checks pass. Existing desktop releases are older and have not been rebuilt for backend authentication.

Latest local source adds the zen workspace, additional diagram editors, and cross-cloud architecture support for AWS, Azure, GCP, Oracle Cloud and IBM Cloud. Official offline inventories contain 1,137 directory/API entries; additional entries and cross-cloud transfer remain unpriced. Cloud project format is now version 3 with validated version 1/2 migration; drawing version 2 adds image references. First-launch/new-project cost choices and Mermaid/XML/XLSX/PNG/JPEG exchange are implemented. See [project modes and file exchange](handoffs/project-modes-and-file-exchange.md). See [latest cross-cloud handoff](handoffs/cross-cloud-inventories.md). Web assets and ZIP are refreshed; the desktop installers described below are from the earlier source commit and do not yet include these UI/domain updates.

All requested desktop release builds are complete from source commit `5149c00`: Apple Silicon Mac app/DMG, Windows x64 NSIS EXE/MSI, and Linux x64 AppImage/DEB. Native Windows/Linux jobs passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062); their artifacts are downloaded locally. Mac built and verified locally.

Installers are in `release/tauri`, `release/tauri/windows` and `release/tauri/linux`. `release/tauri/BUILD_MANIFEST.json` records source, runner URL, byte sizes and SHA-256 digests; `SHA256SUMS.txt` provides checksums. The Mac app is under `packages/desktop/target/aarch64-apple-darwin/release/bundle/macos`.

Validation passed: clean npm install, lint, strict TypeScript/production build, 77 unit tests, 13 browser scenarios, 9 packaging checks, Rust tests and two-launch native smoke tests on all three operating systems. The native checks cover persistence, icons, fullscreen and JSON/PNG/ZIP exports. Mac signature/DMG checks pass; downloaded installer formats and Linux package metadata/payload were verified.

The codebase uses separate web/Windows/Mac/Linux app folders and shared UI/domain/adapters/Rust packages. The original build used project version 1; the latest source migrates existing projects to version 3 while retaining the same browser storage database. Current source now includes the authenticated backend described above; those older installers predate it. Source and the Windows test-overlay fix were pushed to `feat/next-implementation` as authorized for these builds; no main merge, hosted deployment or GitHub Release was created.

Remaining manual checks: installed-package/save-dialog interaction, representative Draw.io/Visio imports and production signing/notarization if distribution is requested. Windows is unsigned; Mac uses ad-hoc signing and is not notarized.

See [structure](../docs/architecture/codebase-structure.md), [required infrastructure](../infra/REQUIRED_INFRA.md), [validation](validation.md), [known issues](known-issues.md) and [handoff history](handoffs/implementation.md).

## pnpm and deployment preparation — 2026-10-09

Active tooling now uses pinned pnpm 12.10.1 and its frozen workspace lockfile. Dependency refresh/audit reports zero known advisories; full application checks and PostgreSQL integration passed. Portable web/backend runtime artifacts are prepared under `release/deployment-2026-10-09`. Production migration/start remains blocked by the development OTP gate; nothing was deployed. See [handoff](handoffs/pnpm-and-deployment.md).

## Dark mode — 2026-10-09

Shared UI now offers persistent System/Light/Dark appearance on login and workspace screens. System follows OS changes; exports retain their palette. Validation: lint, strict typecheck, 121 shared tests, builds, 29 browser scenarios, packaging and deployment checks passed. See [handoff](handoffs/dark-mode.md).

## Frontend auth checks and local models — 2026-10-09

Registration now blocks invalid email/password submissions and known temporary-email domains locally. Improved HTTP/field/retry errors; local AI keys are explicitly optional and blank keys omit Authorization. Backend running on 127.0.0.1:3001; health/readiness HTTP 200 confirmed. Validation: 163 shared tests, 31 browser scenarios, lint/typecheck/build and packaging/deployment checks passed. See [handoff](handoffs/frontend-auth-validation.md).

## Catalog discovery and project choices — 2026-10-09

Project-start dialog now uses responsive choice cards. Service/asset search spans providers directly, groups results by provider and recognizes generic keywords and Elasticsearch/OpenSearch. No search server was added. Lint, 169 shared tests, 32 browser scenarios, builds and packaging/deployment checks passed. See [handoff](handoffs/catalog-search-and-project-dialog.md).

## Third-party assets — 2026-10-09

Added 64 visual tools with searchable CI/CD, database, observability and infrastructure keywords. Original SVG badges are seeded into the backend database; the running catalog exposes all 64. Validation passed: lint, 172 shared unit tests, 33 browser scenarios, builds and packaging/deployment checks. See [handoff](handoffs/third-party-assets.md) and [asset list](../docs/product/third-party-assets.md).

## Workspace logout — 2026-10-09

Visible header logout saves pending changes and ends the session, with busy/retry handling. Full checks passed: lint, 172 shared unit tests, builds, 34 browser scenarios and packaging checks. See [handoff](handoffs/workspace-logout.md).

## Project dashboard and spacing — 2026-10-09

Dedicated dashboard now lists/searches device projects and account snapshots and creates named, provider-aware projects with cost/simple mode. Root visits with saved projects open the dashboard; workspace/settings deep links remain. Standardized padding, responsive headers, select/header/disclosure chevrons and choice dialogs. Fixed hidden-canvas fitting and bodyless JSON logout. Validation: 173 shared tests, six backend unit tests, 36 browser scenarios, lint/typecheck/build, packaging and deployment checks passed; live backend logout HTTP 200. See [handoff](handoffs/project-dashboard-and-ui-spacing.md).

## Popup and menu consistency — 2026-10-09

Shared surfaces now use consistent padding, field gaps, control sizes and opaque backgrounds. Fixed mobile header clipping, menu/inspector layering and notification overlap; account/device confirmations use accessible application dialogs. DevTools Protocol review covered desktop/mobile/dark. Full pnpm check passed with 176 shared tests, six backend tests, 43 browser scenarios and packaging/deployment checks. Native installers were not rebuilt. See [handoff](handoffs/popup-spacing-review.md).
