# Current validation — OTP and security hardening

2026-10-09: lint, 117 shared tests, 21 real PostgreSQL/backend tests, 27 browser scenarios, strict UI/server builds and nine packaging checks pass. Dependency audit reports zero vulnerabilities. Live password → OTP → database-backed diagram → PNG export passes under the preview CSP; temporary test account removed. See [security handoff](handoffs/otp-and-security-hardening.md). Desktop installers/native auth smoke tests were not rebuilt or run for the current backend.

The following records earlier desktop build validation only.

# Validation — desktop build completion

Updated 2026-10-07. Build source `5149c00c97941126c94575e81ff3f204a5a3834b`. Native Windows/Linux [workflow](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062) passed; Mac release build ran locally. AI tests use mocked responses and no paid calls.

| Check | Result |
| --- | --- |
| Clean npm workspace install | Passed locally and on both runners |
| Lint / strict TypeScript / production web build | Passed |
| Unit tests | 77 cases passed |
| Browser acceptance tests | All 13 passed locally, Windows and Linux |
| Packaging checks | All 9 passed, including Windows Cargo overlay regression |
| Rust unit tests | All 4 passed on Mac, Windows and Linux |
| Native webview smoke | Two launches passed on all three OSes; persistence, icons, fullscreen and JSON/PNG/ZIP verified |
| Mac release | app/DMG generated; code signature and disk-image checksum valid |
| Windows release | x64 EXE/MSI generated and downloaded; PE/OLE headers verified |
| Linux release | x64 AppImage/DEB generated and downloaded; ELF/AppImage/DEB metadata and production payload verified |
| Production smoke-hook exclusion | Checked in Mac executable and Linux DEB payload |
| Artifact SHA-256 | Recorded in ignored `release/tauri/BUILD_MANIFEST.json` and `SHA256SUMS.txt` |
| Workflow / shell / Rust formatting | Passed |
| Installed-package save dialogs | Manual check remains |
| Draw.io / Visio importer compatibility | Manual check remains |

First native run: Linux passed; Windows failed before unit tests because direct Cargo lacked its platform icon overlay. The launcher now supplies `TAURI_CONFIG` to Cargo tests using the same checked-in host overlay as Tauri builds. A regression test verifies an existing Windows ICO is provided. The subsequent full workflow passed.

Native smoke suites use isolated profiles/identifiers and a separate smoke feature; production builds omit those hooks. Installer generation and header/metadata verification do not claim that every interactive installer/save-dialog flow was manually exercised. Windows packages are unsigned, and Mac is ad-hoc signed without notarization.

Canonical version 1, entity IDs, IndexedDB name, pricing formulas and AI/export contracts remain unchanged. Existing large-chunk/dependency annotation warnings are nonfatal. Build outputs and downloaded CI archives are ignored by Git.

## pnpm migration and dependency review — 2026-10-09

Frozen pnpm install, full audit (zero advisories), lint, 117 shared tests, 6 backend unit tests, 21 actual PostgreSQL integration tests, web/backend build, 27 browser tests, 9 packaging tests and 4 deployment tests passed. Portable release generation passed; packaged production preflight correctly rejected fixed development OTP. No native rebuild or public deployment. Evidence and limitations: [dependency review](../docs/security/dependency-review-2026-10-09.md).

## Dark mode — 2026-10-09

pnpm lint/typecheck, 121 shared unit tests, 6 backend unit tests, web/backend builds, 29 browser scenarios, 9 packaging tests and 4 deployment tests passed. Dark login screen visually inspected in local preview. No schema or backend behavior changed; database integration was not repeated. Native/release artifacts were not rebuilt.

## Frontend auth validation/local AI — 2026-10-09

pnpm lint/typecheck, 163 shared unit tests, 6 backend unit tests, web/backend builds, 31 browser tests, 9 packaging tests and 4 deployment tests passed. Registration browser checks confirm invalid submissions send no request; mocked local AI extraction and variant generation succeed without Authorization. Backend-client tests cover HTTP status preservation, field errors, HTML errors, 204 responses, invalid success bodies, network failures, timeouts/cancellation and Retry-After dates. Actual backend health and PostgreSQL readiness returned HTTP 200. No backend policy or migration changes.

## Catalog search and project dialog — 2026-10-09

Passed lint, strict TypeScript/build, 169 shared unit tests, 32 Playwright scenarios, nine packaging checks and four deployment-script checks. Six backend unit tests passed; database integration was not repeated. Visual checks covered light/dark and narrow-screen project choices. Native binaries were not rebuilt.

## Third-party tools — 2026-10-09

Passed complete pnpm check: lint, strict TypeScript, 172 shared unit tests, web/backend builds, 33 browser scenarios and nine packaging checks. Four deployment checks also passed. New acceptance verifies named/CI searches, insertion, loaded SVG badges, JSON asset IDs and reload persistence. Existing database seeded successfully; live backend catalog confirmed 64 third-party assets. Native installers not rebuilt.

## Workspace logout — 2026-10-09

Complete pnpm check passed: lint, typecheck/build, 172 shared unit tests, six backend unit tests (15 integration tests skipped), 34 browser scenarios and nine packaging checks. Added header logout failure/retry and session-reset/reload coverage. Native installers were not rebuilt.

## Dashboard, spacing and disclosures — 2026-10-09

Complete pnpm check passed: lint, strict TypeScript, 173 shared unit tests, six backend unit tests (15 PostgreSQL integration tests skipped), web/backend build, 36 browser scenarios and nine packaging checks. Four deployment-script checks passed separately. Live backend accepted corrected bodyless POST logout with HTTP 200.

UI review used Chromium Chrome DevTools Protocol DOMSnapshot and Page.getLayoutMetrics plus desktop, mobile and dark screenshots. Acceptance verifies project creation/provider/mode, local search/open/reload, default dashboard routing, account snapshots and recoverable account-list errors, card padding, viewport overflow and chevron alignment. Manual edit/export regression verifies dragged architecture positions. Final select-arrow specificity received an additional targeted browser check and preview rebuild. Native installers were not rebuilt.

## Popup and menu consistency — 2026-10-09

Complete pnpm check passed: lint, strict TypeScript, 176 shared unit tests, six backend unit tests (15 PostgreSQL integration tests skipped), web/backend builds, 43 browser scenarios, nine packaging checks and four deployment checks. DevTools Protocol layout metrics/DOM snapshots and screenshots cover desktop, mobile and dark appearance across project/account dialogs, auth, AI settings, palettes, inspectors, connections, exports and notifications. Native file choosers remain OS controlled; native installers were not rebuilt. No schema, pricing, dependency or infrastructure changes. See [review notes](../docs/product/ui-consistency.md).
