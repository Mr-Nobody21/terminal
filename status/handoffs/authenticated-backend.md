# Authenticated backend handoff

Completed locally 2026-10-09. User explicitly authorized backend/auth/database scope, superseding the original MVP restriction. AGENTS.md and all earlier user changes are preserved.

## Changed files

- `backend/package.json`, strict TS/build/test configuration and `src/{app,server,config,db,manage,seed}.ts`.
- `backend/src/modules/{auth,assets,projects}.ts` and three ordered SQL migrations: users/sessions, assets/blobs/projects, deduplication/project asset references.
- Runtime SVG sources/manifests/licenses relocated to `backend/assets/{icons,drawing-assets}`; verified identical web public duplicates removed. Importer and attribution paths updated.
- Shared adapter backend client/catalog cache, export icon resolvers and account-scoped IndexedDB repositories.
- Shared UI auth gate/account panel, image-upload handling, service palette/diagram image resolution and auth styling; web dev/preview API proxy.
- Root workspace scripts/lockfile, environment ignore rules, PostgreSQL compose file, backend/architecture/infrastructure/product/setup documentation.
- Backend unit/SQL tests, local storage isolation test and browser auth/account tests; existing workspace tests now use a backend fixture catalog.

## Decisions

PostgreSQL 17 stores actual SVG/PNG/JPEG bytes, not filesystem URLs. A byte-storage interface covers upload/read/catalog paths for later S3 implementation. Seeding preserves stable asset IDs and attribution. Uploaded bytes are deduplicated per owner. Account project saves validate canonical schemas and store project, drawings, image blobs and asset links in one transaction; revisions reject stale writers.

Auth uses asynchronous salted scrypt and opaque HttpOnly cookie sessions with only digests stored. Explicit CORS origins/CSRF headers, auth rate limits and request/upload limits are implemented. Google sign-in is disabled and makes no request. AI keys remain in browser memory and are excluded from server project contracts.

Current canonical versions remain project 3/drawing 2. Account ownership and revisions are metadata. Device autosave remains a per-account recovery cache; old databases remain untouched and can be imported explicitly. Portable drawings retain embedded reference bytes. Platform launcher artwork remains a build input in platform folders. No paid service, backend deployment, Google integration or S3 bucket has been created.

## Validation

- `npm run lint`: pass.
- `npm test -- --run`: 115 tests across 20 files pass.
- `npm run test:backend:integration`: 11 tests across two files pass against real PostgreSQL 17.10. Migrations/reseeding/checksum drift, auth/session digests/expiry/revocation, CSRF/rate limits, cross-user ownership, binary uploads, canonical round-trip/conflicts and transactional embedded image storage covered. Temporary schemas are removed afterward.
- `npm run build`: strict UI/backend types, Vite UI and bundled server pass.
- `npm run test:e2e`: full 25-scenario run passed; subsequent three auth scenarios passed after adding reload/revision coverage (26 unique scenarios total).
- `npm run test:packaging`: nine checks pass.
- Live browser check against real backend: registration, four database-loaded service icons and account save pass. Temporary account removed afterward. Production server bundle readiness passed. Login/workspace screenshots visually inspected.
- `git diff --check`: pass.

Local PostgreSQL database `planner` was created under ignored `.runtime/`; private ignored `backend/.env` contains connection credentials. All three migrations and 61 catalog SVGs are installed. The backend runs on port 3001 and web preview on port 4173. No user accounts/passwords are seeded. Web distribution refreshed; native installers were not rebuilt.

## Known limits and next steps

No real Google OAuth, S3 storage, email verification/password-reset delivery or MFA. Before any deployment: select hosting, configure HTTPS/secrets/backups/monitoring and test target native origins/cookies. Desktop installers and native webview auth smoke harness have not been rebuilt/validated for this backend; packaging configuration checks alone are not native integration acceptance. Existing dependency annotation/large-chunk warnings remain nonfatal. Representative Draw.io/Visio manual import checks remain pending from earlier work.

Recommended next task: configure the intended runtime environment and native API URLs, then rebuild/verify all desktop applications. Implement Google OAuth or S3 only when requested, with separate configuration/migration work.
