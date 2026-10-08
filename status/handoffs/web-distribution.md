# Web distribution

Date: 2026-10-08

## Delivered

Built the separate `apps/web` browser application with the updated manual architecture editor. Added root `build:web` and `preview:web` commands and the web workspace preview script. Updated `docs/platforms/web.md` and `apps/web/README.md` with build, preview, static hosting and browser-storage instructions.

Generated ignored distribution artifacts:

- `apps/web/dist/`: static production assets.
- `release/web/Cloud-Architecture-Planner-web-0.1.0.zip`: static files at archive root.
- `release/web/SHA256SUMS.txt`: archive checksum.

No deployment or backend was added. Browser and native desktop applications continue to consume the same shared React UI.

## Validation

- `npm run build:web` (includes typecheck and production build): passed.
- `npm run lint`: passed.
- `npm test -- --run`: 77 tests passed.
- Production-preview Chromium smoke: service creation, reload persistence and JSON download passed with no page errors.
- ZIP integrity and root `index.html`: verified.
- `npm run test:e2e`: all 14 browser scenarios passed.

Existing nonfatal dependency-annotation and large-chunk build warnings remain. The preview is local only; serve the static files over HTTP/HTTPS. A different host or port has separate IndexedDB storage. Next distribution step, if requested, is deployment to the user's chosen static host.
