# Required infrastructure

The current application requires the Node.js backend and PostgreSQL 17 for accounts, assets and optional account project snapshots. No hosted resource has been provisioned. Architecture estimates describe the user's proposed cloud infrastructure, not infrastructure required to run this planner.

| Area | Required | Purpose / cost |
| --- | --- | --- |
| Web development | Node.js 22.20+ or 24 LTS, pnpm 12.10.1, browser | Local development/build; no mandatory paid service |
| Browser tests | Playwright Chromium | Local or CI acceptance checks |
| Desktop development | Rust, Tauri OS prerequisites | Local native shell and packaging |
| macOS builds | macOS ARM64, Xcode command-line tools | Current Apple Silicon app/DMG profile |
| Windows builds | Windows x64, C++ build tools/SDK, WebView2 | Current EXE/MSI profile |
| Linux builds | Linux x64, WebKitGTK and system build libraries | Current AppImage/DEB profile |
| Linux native tests | Xvfb/display, Openbox/window manager | Native webview/fullscreen checks |
| Web distribution | Optional static file host | Required only when web deployment is requested |
| AI usage | Optional user endpoint/key or local model | User provider may charge for submitted requests |
| Release signing | Optional platform credentials | Required only for requested signed distribution |
| Backend runtime | Node.js 22.20+ or 24 LTS | Local service now; hosting is a later deployment choice |
| Database | PostgreSQL 17 | Users, sessions, projects and image bytes; local Docker configuration in `database/compose.yml` |
| S3 / Google OAuth | Not required | Future integration; Google button is disabled |

See [local development](local-development.md), [build runners](build-runners.md) and [release signing](release-signing.md). Requirements document existing build profiles; no infrastructure is provisioned by this change.


Current OTP verification uses a fixed development code and refuses production startup. A real enrolled second-factor/recovery integration and deployment security configuration are required before public production use. No extra hosted service is needed for the local demonstration. See [security review](../docs/security/review-2026-10-09.md).
