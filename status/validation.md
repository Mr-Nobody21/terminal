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
