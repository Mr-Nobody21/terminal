# Planner backend

Separate TypeScript/Fastify service in the same pnpm workspace. PostgreSQL 17 stores users, password hashes, opaque session digests, canonical project snapshots, asset metadata and binary asset contents. The UI requires this service for authentication and runtime assets. Google sign-in is a disabled UI placeholder; no OAuth integration exists.

## Run locally

Use Node.js 22.12+ and PostgreSQL 17. From the repository root:

```sh
pnpm install --frozen-lockfile
cp backend/.env.example backend/.env
# Edit DATABASE_URL with your database credentials.
# Optional local database using Docker:
export POSTGRES_PASSWORD='your-strong-local-password'
docker compose -f infra/database/compose.yml up -d
pnpm --filter @planner/backend run migrate
pnpm --filter @planner/backend run seed
pnpm run dev:backend
# In another terminal:
pnpm run dev
```

Backend defaults to `127.0.0.1:3001`; Vite development and preview proxy `/api` there. Use `VITE_BACKEND_URL=https://your-api.example/api` at UI build time for a separate host. Prefer serving UI and `/api` under the same HTTPS origin. Build with `pnpm run build:backend`, start with `pnpm --filter @planner/backend start` from the checkout. Migrations and seed are explicit release steps, never automatic on server startup. SQL and source seed assets remain under `backend/` next to the bundle.

The local development environment configured during implementation uses a private ignored `backend/.env` and PostgreSQL under ignored `.runtime/` on port 55432. No accounts/passwords are seeded. Create your account in the UI. This local database is not a hosted resource.

## Structure

```text
backend/
  src/
    app.ts           HTTP assembly, CORS, CSRF, rate limits and errors
    server.ts        Startup/shutdown and readiness
    config.ts        Validated environment settings
    db.ts            PostgreSQL pool and migration runner
    manage.ts        Migration/seed CLI
    seed.ts          Idempotent catalog ingestion
    security/        Password hashing, OTP verifier, shared throttling/audit, image checks
    modules/
      auth.ts        Registration, login, sessions, password changes
      assets.ts      Asset API and Postgres storage implementation
      projects.ts    Validated user-owned snapshots with revision checks
  migrations/        Ordered, checksummed transactional SQL migrations
  assets/            Vendor SVG source seeds, manifests and licenses
  tests/             Unit and real PostgreSQL integration tests
  .env.example       Configuration template; secrets are never committed
```

## API

All endpoints are under `/api`. JSON mutations require `X-Planner-Request: 1`, plus an allowed Origin when present. Cookie-authenticated browser clients send `credentials: include`. There is no bearer token in localStorage.

| Method/path | Behavior |
| --- | --- |
| GET `/health`, `/ready` | Liveness / PostgreSQL readiness |
| POST `/auth/register` | `{email,password,displayName}`; create account and pending OTP challenge |
| POST `/auth/login` | `{email,password}`; pending OTP challenge |
| POST `/auth/verify-otp` | `{otp}` and challenge cookie; issue verified session |
| GET `/auth/me` | Current account, no password/hash/token |
| POST `/auth/logout` | Revoke session and clear cookie |
| POST `/auth/password` | `{currentPassword,newPassword,otp}`; revoke all sessions |
| GET `/assets/catalog` | Public seeded SVG catalog with embedded contents/attribution |
| GET/POST `/assets` | List own uploads / upload `{name,mime,base64}` |
| GET/DELETE `/assets/:id` | Read own upload (or public catalog asset) / delete own upload |
| GET `/projects` | List own project summaries |
| GET/DELETE `/projects/:id` | Read/delete own snapshot |
| PUT `/projects/:id` | `{document,drawings,revision}`; zero creates, current revision updates |

Invalid fields return 400 with paths; unauthenticated requests 401; cross-user private IDs 404; stale project revisions 409; rate limits 429; dependency failures 503. Request bodies are capped at 10 MB. Uploads accept PNG/JPEG signatures only, up to 5 MB; catalog SVGs are trusted checked-in sources and cannot be uploaded by users. Keep trusted sources reviewed before seeding. Asset deletion is explicit; deleting a project does not delete reusable uploads.

## Authentication and operations

Passwords use asynchronous scrypt with random 16-byte salts (`N=32768,r=8,p=3`, 64-byte output; legacy p=1 hashes upgrade on correct-password login). Passwords have 12–128 characters. Sessions use 32 random bytes and store only SHA-256 digests; the HttpOnly cookie expires after seven days by default. Password change revokes all sessions. Expired sessions are removed when issuing sessions. Auth routes are rate limited; the development OTP verification step is implemented; real enrolled MFA, email verification, password-reset email and Google OAuth remain unimplemented. Configure HTTPS, backups, monitoring and secrets before any production deployment. Account/password/OTP abuse counters persist in PostgreSQL; aggregate and endpoint IP rate limits remain process local.

Current fixed OTP mode refuses `NODE_ENV=production`; implement a real second-factor provider before deployment. Secure cookies are available for HTTPS development. SameSite=Lax is default. Native desktop webviews or truly cross-site UI/API setups require HTTPS, `COOKIE_CROSS_SITE=true`, `COOKIE_SECURE=true`, and explicit origins in `CORS_ORIGINS` (for example `tauri://localhost` or `http://tauri.localhost` for the target platform). No wildcard/null origins, proxy trust or cloud resources are configured. Desktop installers must be rebuilt with the appropriate API URL and tested against that deployment; existing installers are older builds.

Migration ledger checksums prevent editing already-applied migrations; add a new SQL file instead. A PostgreSQL advisory lock serializes migration runs; each file runs in a transaction. Back up before upgrades. Restore database backups rather than destructive automatic down migrations. Back up both metadata and `asset_blobs` together.

## Assets and S3 transition

`backend/assets` is the reviewed seed source, not a public frontend directory. `pnpm run seed` puts 61 SVGs into PostgreSQL `bytea`, preserving stable IDs on reseed. Metadata retains logical keys, hashes, size and source attribution. Browser startup fetches the catalog and caches SVG data in memory for rendering and portable editable exports. PNG/JPEG imports upload before committing a diagram edit; their embedded drawing bytes remain a recovery/export cache. Imported legacy JSON/XML/XLSX remains portable and local until an explicit account save. Account saves ingest embedded image bytes, deduplicate by owner/hash and link project assets in the same database transaction. Platform launcher icons stay in platform build folders because installers require them at build time. Pricing/catalog JSON remains domain data, not image storage.

`AssetStorage` separates byte reads/writes from API routes. A later S3 migration should copy blobs, verify SHA-256, update storage provider/key transactionally, implement S3 reads/writes and only remove verified PostgreSQL blobs after backup. No bucket, SDK, access key or recurring paid infrastructure is introduced now.

## Checks

```sh
pnpm run lint
pnpm test --run
pnpm run test:backend
# Real database suite: creates and drops an isolated random schema.
# Never needs to remove application tables.
pnpm run test:backend:integration
pnpm run build
pnpm run test:e2e
```

The integration command uses `TEST_DATABASE_URL`, or local `backend/.env` DATABASE_URL. Without a database the ordinary backend test command runs primitives and skips SQL tests; use the integration command as the database acceptance gate. See [backend ADR](../docs/architecture/decisions/ADR-002-authenticated-backend.md).

## Development OTP and security controls

After registration or a correct password, enter **904530** in the verification screen. This is the requested fixed development code, not real independent MFA or a rotating code. The server never sends it to the UI. Challenges expire in five minutes, allow five guesses and cannot be replayed. Pre-OTP sessions are rejected after migration 004; existing users sign in again. No account/project/asset data is deleted. Google remains disabled.

Run `pnpm --filter @planner/backend run migrate` before starting the updated server. The new migration creates challenges, shared auth counters and audit events and adds verified/idle session metadata. Session inactivity is limited to 30 minutes, with at most five sessions/account. Password changes require the current password and development OTP and revoke all sessions/challenges.

See the [security review](../docs/security/review-2026-10-09.md) for exact limits, mitigated findings and production gates. Web preview applies CSP/security headers; static hosts must use `apps/web/public/_headers` or equivalent headers. New uploads are capped at 5 MB/32 MP, 50 MB/500 files per account; project snapshots are capped at 100 per account. Backend requests, database statements and browser API calls have timeouts. Public catalog loads are cached/coalesced for 60 seconds; reseeding is visible after cache expiry or a server restart.
