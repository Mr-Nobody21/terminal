# Cloud Architecture Planner MVP — Export Bundle

This export contains the implementation handoff for the local-first, near-zero-infrastructure-cost MVP.

## Contents

- `IMPLEMENTATION_PLAN.md` — phased implementation plan
- `AGENTS.md` — repository-level Codex instructions
- `CODEX_HANDOFF.md` — initial Codex execution prompt
- `codex_handoff.sh` — bootstrap + optional Codex handoff script
- `docs/ADR-001-local-first.md` — local-first/backendless architecture decision
- `docs/CANONICAL_MODEL.md` — canonical architecture model guidance
- `docs/PLUGIN_AND_SKILL_MATRIX.md` — recommended tools/plugins
- `.codex/skills/` — project-specific Codex skills

## Quick Start

```bash
unzip cloud-architecture-planner-mvp-export.zip
cd cloud-architecture-planner-mvp-export
chmod +x codex_handoff.sh
./codex_handoff.sh ../cloud-architecture-planner --run
```

## MVP Rule

The canonical architecture model is the source of truth.

AI:
- interprets requirements
- generates structured architecture proposals
- asks clarification questions

Deterministic code:
- validates architecture
- calculates pricing
- lays out diagrams
- generates exports


## Implemented application

The static React MVP now lives in this repository. See [implementation handoff](status/handoffs/implementation.md) for phase status, validation and known limits. Existing handoff text above is retained.

Use Node.js 22+ and npm:

```bash
npm ci
npx playwright install chromium
npm run dev
npm run check
```

This workspace also contains an ignored, local macOS ARM Node runtime. To use it in this shell:

```bash
export PATH="$PWD/.runtime/bin:$PATH"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.runtime/browsers"
npm run dev
```

Projects autosave to IndexedDB on this browser origin. Export JSON before changing origin or clearing browser data. AI is optional: settings persist endpoint/model preferences; keys stay in memory. No AI calls occur until submission. Production files are generated under `apps/web/dist/` by `npm run build`; hash navigation and relative assets support static hosting. No deployment has been performed.

## Mac desktop application

The Rust-based Tauri desktop shell uses macOS WebKit. With Rust and Xcode Command Line Tools installed, build the Apple Silicon `.app` and `.dmg` locally:

```bash
npm run build:mac
```

The DMG is in `release/tauri/`; the app is under `packages/desktop/target/aarch64-apple-darwin/release/bundle/macos/`. Run `npm run desktop` for the desktop application or `npm run test:desktop` for native acceptance tests. See [Mac desktop build](docs/platforms/mac.md) for installation, local project transfer, platform requirements and signing limitations.


## Windows and Linux desktop packaging

Run `npm run build:windows` on Windows x64 for EXE/MSI installers, or `npm run build:linux` on Linux x64 for AppImage/DEB packages. `npm run build:desktop` selects the native platform. Windows/Linux builds and native smoke tests passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062); the downloaded installers are in `release/tauri/windows` and `release/tauri/linux`. See [desktop builds](docs/platforms/desktop-builds.md) for prerequisites, output paths and verification status.

Code organization is documented in [Codebase structure](docs/architecture/codebase-structure.md).

## Workspace organization

Platform applications live in `apps/web`, `apps/windows`, `apps/mac` and `apps/linux`. Shared UI, domain, adapters and the Rust shell live in `packages`. `backend` is reserved documentation only.

See [codebase structure](docs/architecture/codebase-structure.md), [development setup](docs/development/setup.md), [current status](status/STATUS.md), [planning](planning/IMPLEMENTATION_PLAN.md) and [required infrastructure](infra/REQUIRED_INFRA.md). Root npm commands remain available; npm workspaces use one root lockfile.
