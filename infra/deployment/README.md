# Deployment artifacts and operations

Use Node 22.20+ (22 LTS) or Node 24 LTS and pinned pnpm 12.10.1. Install pnpm using the [official instructions](https://pnpm.io/installation). All installation, validation and release commands use pnpm.

```sh
pnpm install --frozen-lockfile
pnpm deploy:prepare release/deployment-2026-10-09
pnpm deploy:check release/deployment-2026-10-09
# Only after real MFA is implemented and production preflight succeeds:
pnpm deploy:migrate release/deployment-2026-10-09
pnpm deploy:start release/deployment-2026-10-09
```

Prepare performs a full dependency audit and all checks, builds the web UI and backend/management CLI, and packages only backend runtime dependencies, migrations and seed assets. It refuses to overwrite a release. Credentials, source tests and development tools are excluded. CI must install Chromium with `pnpm exec playwright install --with-deps chromium` before preparing. Database integration checks additionally require `pnpm test:backend:integration` against an isolated test database.

**Production is blocked:** the current fixed development OTP is not real MFA. `deploy:check` invokes the application's production configuration and fails explicitly. The backend also independently refuses production startup. Do not disable this check or run development mode on a public host. A real second-factor provider, HTTPS, approved origins and trusted proxy/IP handling must be implemented before deploying publicly.

After resolving that blocker, deployment operators should:

1. Provision PostgreSQL 17+ privately, create a least-privilege application role and supply DATABASE_URL through the host's secret manager. Configure HOST, PORT, explicit CORS_ORIGINS, NODE_ENV=production and secure cookies. Never put secrets in artifacts or frontend environment variables.
2. Back up PostgreSQL with `pg_dump` before schema changes. In the packaged backend directory run `node dist/manage.js migrate`, followed by `node dist/manage.js seed`. Migrations are ordered, transactional and checksum-checked. Take these steps only after production preflight passes.
3. Run `node dist/server.js` under a process supervisor with an unprivileged account, resource limits and graceful shutdown. Serve `web/` with a static HTTP server, SPA fallback to index.html and same-origin `/api/` reverse proxy to the backend. Apply the bundled `_headers` policy in the chosen host's configuration; it is not automatically honored by every server. Terminate HTTPS before exposing traffic; configure trusted proxy behavior without accepting spoofed client IPs.
4. Verify `/api/health`, database connectivity, password plus MFA login, asset access and project save/reload before switching traffic. Keep the prior artifact for rollback. Schema rollback requires a reviewed restore/migration plan; never automatically delete database volumes or reverse migrations.

No provider, host, domain or credentials have been selected. These scripts prepare portable artifacts; they do not upload, publish, provision infrastructure or change running services. Native installers continue to use `pnpm build:mac`, `pnpm build:windows`, and `pnpm build:linux` on their respective runners.
