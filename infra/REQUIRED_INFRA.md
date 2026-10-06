# Required infrastructure

The current application requires no hosted backend, database, queue, authentication service or project storage. Architecture estimates describe the user's proposed cloud infrastructure, not infrastructure required to run this planner.

| Area | Required | Purpose / cost |
| --- | --- | --- |
| Web development | Node.js 22.12+, npm, browser | Local development/build; no mandatory paid service |
| Browser tests | Playwright Chromium | Local or CI acceptance checks |
| Desktop development | Rust, Tauri OS prerequisites | Local native shell and packaging |
| macOS builds | macOS ARM64, Xcode command-line tools | Current Apple Silicon app/DMG profile |
| Windows builds | Windows x64, C++ build tools/SDK, WebView2 | Current EXE/MSI profile |
| Linux builds | Linux x64, WebKitGTK and system build libraries | Current AppImage/DEB profile |
| Linux native tests | Xvfb/display, Openbox/window manager | Native webview/fullscreen checks |
| Web distribution | Optional static file host | Required only when web deployment is requested |
| AI usage | Optional user endpoint/key or local model | User provider may charge for submitted requests |
| Release signing | Optional platform credentials | Required only for requested signed distribution |
| Backend/runtime cloud resources | None | No recurring platform cloud infrastructure required |

See [local development](local-development.md), [build runners](build-runners.md) and [release signing](release-signing.md). Requirements document existing build profiles; no infrastructure is provisioned by this change.
