# pnpm, dependency review and portable deployment — 2026-10-09

Changed root/workspace manifests, pnpm workspace/lock, CI workflows, Tauri and Playwright hooks, bootstrap/native scripts, Vite chunk resolution, backend build/integration launcher, AI error causes, current setup/platform docs, and new `tooling/scripts/deployment`, `infra/deployment`, and `docs/security/dependency-*` files. AGENTS.md and unrelated user edits are preserved.

Pinned pnpm 12.10.1 replaces npm in active tooling. Strict workspace linking exposed implicit Vite manual-chunk resolution; chunk assignment now uses resolved module IDs. Backend deploy packages include compiled management/config files, migrations, seed assets and runtime dependencies only. Production operations use the application's own configuration gate and cannot bypass the fixed-OTP restriction.

Validation: frozen install, audit (0 known advisories), lint, 117 shared tests, 6 backend unit tests, 21 PostgreSQL integration tests, web/backend builds, 27 browser scenarios, 9 packaging tests, 4 deployment tests, portable artifact generation and expected production preflight rejection. Artifact: `release/deployment-2026-10-09/` (ignored). No deployment, publishing or external writes occurred.

Known issues: real MFA required for production; no destination/domain selected; native auth smoke fixtures still need updates and installers were not rebuilt; nonfatal bundle/annotation warnings remain. Next: real MFA and host-specific HTTPS/proxy configuration before production deployment. See the dependency review and deployment operations for exact commands and audit limits.
