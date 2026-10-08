# OTP and security hardening handoff

Completed locally 2026-10-09, following the user's request for a default OTP and a security/optimization pass. The requested spoken code is interpreted as **904530**.

## Files changed

- Backend migration `004_auth_security.sql`: credential versions, verified/idle sessions, OTP challenges, shared throttle counters and security events.
- `backend/src/modules/auth.ts`: password-to-challenge-to-session flow for registration and login; session rotation/caps/idle expiry; challenge revocation on password change; v1 password hash upgrades.
- New `backend/src/security/{password,otp,throttle,images}.ts`: bounded scrypt work, development-only code verifier, persistent limits/audit/retention and image header dimensions.
- Backend HTTP/config/database/asset/project modules: aggregate and endpoint limits, request/query deadlines, CORS validation, security headers, transactional account quotas, coalesced public catalog cache and duplicate-upload write avoidance.
- Shared UI auth gate: OTP form, expiry/restart states and Retry-After cooldown. Shared API client: timeout/cancellation and typed retry guidance.
- Web preview headers and `apps/web/public/_headers`: CSP and browser security headers.
- Auth/backend/client/browser tests and security/setup/product/status documentation.

## Decisions

The fixed code is a development demonstration, not genuine independent MFA or a rotating OTP. Production configuration refuses startup until a real provider is implemented. The backend never returns the code and the frontend bundle does not contain it. Challenge tokens use HttpOnly cookies and hashed database records; five-minute expiry, five guesses and row locks prevent challenge replay/concurrent consumption. Password verification alone cannot call authenticated APIs.

Migration 004 preserves accounts/projects/assets and retains existing session rows for expiry cleanup, but rejects pre-OTP sessions lacking verification metadata. Existing users sign in again. Backend password hashes are versioned independently from canonical architecture contracts. New scrypt hashes use p=3; old p=1 hashes verify and upgrade on a correct password. Canonical project version 3/drawing version 2 and deterministic pricing formulas remain unchanged.

Security functions are split from auth routing. The public asset catalog caches/coalesces reads for 60 seconds; duplicate uploads reuse existing bytes. No new paid dependency, backend service, deployment or external write was introduced. UI CSP preserves user-configured BYOK connections and React Flow styles; static hosts must apply the provided headers.

## Validation

- `npm run lint`: pass.
- `npm test -- --run`: 117 tests / 21 files pass.
- `npm run test:backend:integration`: 21 tests / two files pass against real PostgreSQL, including OTP bypass/expiry/guess limits/replay/concurrent consumption, shared account throttling across instances/IPs and expiry reset, session caps/idle/legacy rejection, password upgrades/revocation, quotas, catalog coalescing and image dimensions.
- `npm run build`: strict UI/backend types, Vite UI and Node bundle pass; final backend rebuild after session-pruning correction also passed.
- `npm run test:e2e`: all 27 browser scenarios pass, including incorrect OTP, registration/login/signout, cooldown and expired-step restart; existing cloud/drawing/export/AI fixtures remain passing.
- `npm run test:packaging`: nine checks pass.
- `npm audit`: zero reported vulnerabilities across all severity levels.
- Live real-backend preview: password-only `/auth/me` returns 401; OTP verification opens the database-backed diagram; PNG export works under the UI CSP with no CSP console violations. Temporary account removed afterward; OTP screen visually inspected.
- Migration 004 applied to the local database; `git diff --check` passes. Web UI ZIP refreshed; desktop installers not rebuilt.

## Remaining issues and next step

See [security review](../../docs/security/review-2026-10-09.md) for findings, exact thresholds, evidence and residual risks. Production remains gated on real enrolled MFA and recovery; email verification, account-registration enumeration resistance, coordinated edge limits, operational monitoring/secrets/backups and native auth verification remain pending. This is a local review, not an independent penetration test. Large frontend dependency chunks remain nonfatal warnings.

Next recommendation: implement enrolled TOTP or passkeys with recovery, then configure the target deployment's HTTPS/proxy/headers and perform an independent pre-release security assessment. No publishing was performed.
