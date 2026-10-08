# ADR 002: Authenticated backend and database assets

Accepted 2026-10-08, explicitly requested by the user. Supersedes ADR 001's backend/auth/server-storage prohibitions for the current product. AGENTS.md and the historical MVP plan remain preserved; the user's later authorization controls this scope change.

A separate Node.js/TypeScript Fastify backend lives in `backend/` in the existing repository. PostgreSQL stores accounts, scrypt password hashes, hashed opaque sessions, user-owned canonical project/drawing snapshots, and asset metadata/bytea. Source SVGs move from `data/` and duplicated web public folders into backend seed inputs. Runtime images are fetched from the backend; build-only platform branding remains with each installer.

Registration/login use HttpOnly cookie sessions. Google sign-in is visibly disabled. AI remains browser BYOK with memory-only keys; the backend does not proxy AI, generate prices or alter canonical infrastructure semantics. No backend pricing arithmetic or new paid service is introduced.

Local saves remain a recovery cache and are scoped by account UUID; this is logical separation, not encryption against someone with device/browser access. Legacy databases remain untouched. Importing previous device projects is an explicit local operation. Uploading project snapshots requires Save to account; revision checks prevent silent remote overwrites. Embedded image bytes remain in portable drawing JSON and exports as a recovery cache; PNG/JPEG file imports also upload to private database assets before committing.

No canonical schema changes are required: server ownership/revisions and asset blobs are database metadata; project version 3 and drawing version 2 remain unchanged. Diagram rendering/export consume a fetched trusted catalog cache; pricing formulas, AI output schemas and ID-preserving project JSON round trips are unchanged. Database migrations are ordered/checksummed and transactionally applied. Existing storage is not deleted or automatically uploaded. Future S3 storage uses an explicit byte-storage interface; no S3 resources are created now.

The application now requires a configured backend/database at login, and the frontend bundle alone is no longer a standalone deployment. Runtime cost depends on hosting selected later. Native builds need an API URL and HTTPS/cookie origin configuration before rebuilding/distributing. Details and commands are in [backend README](../../../backend/README.md).
