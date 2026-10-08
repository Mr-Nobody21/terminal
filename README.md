# Cloud Architecture Planner

The current application includes a separate PostgreSQL backend for accounts, sessions, project snapshots and runtime image assets. Start with [backend setup](backend/README.md). Google sign-in is a disabled placeholder. Login now requires a development verification step using `904530`; this fixed code is not real independent MFA and production configuration is blocked. See the [security review](docs/security/review-2026-10-09.md). The historical local-first MVP handoff below is retained; [ADR 002](docs/architecture/decisions/ADR-002-authenticated-backend.md) records the authorized architecture change.

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

The static React MVP now lives in this repository. See the [feature list](docs/product/features.md) for available capabilities and limitations, and [implementation handoff](status/handoffs/implementation.md) for phase status, validation and known limits. Existing handoff text above is retained.

Use Node.js 22.20+ or Node.js 24 LTS and pnpm 12.10.1:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm --filter @planner/backend run migrate
pnpm --filter @planner/backend run seed
pnpm run dev:backend # separate terminal
pnpm run dev
pnpm run check
```

This workspace also contains an ignored, local macOS ARM Node runtime. To use it in this shell:

```bash
export PATH="$PWD/.runtime/bin:$PATH"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.runtime/browsers"
pnpm run dev
```

Projects autosave to account-scoped IndexedDB on this browser origin; explicit account saves store snapshots in PostgreSQL. Export JSON before changing origin or clearing browser data. AI is optional: settings persist endpoint/model preferences; keys stay in memory. No AI calls occur until submission. Production files are generated under `apps/web/dist/` by `pnpm run build`; hash navigation supports static UI hosting with a configured backend API. No deployment has been performed.

## Mac desktop application

The Rust-based Tauri desktop shell uses macOS WebKit. With Rust and Xcode Command Line Tools installed, build the Apple Silicon `.app` and `.dmg` locally:

```bash
pnpm run build:mac
```

The DMG is in `release/tauri/`; the app is under `packages/desktop/target/aarch64-apple-darwin/release/bundle/macos/`. Run `pnpm run desktop` for the desktop application or `pnpm run test:desktop` for native acceptance tests. See [Mac desktop build](docs/platforms/mac.md) for installation, local project transfer, platform requirements and signing limitations.


## Windows and Linux desktop packaging

Run `pnpm run build:windows` on Windows x64 for EXE/MSI installers, or `pnpm run build:linux` on Linux x64 for AppImage/DEB packages. `pnpm run build:desktop` selects the native platform. Windows/Linux builds and native smoke tests passed in [GitHub Actions](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062); the downloaded installers are in `release/tauri/windows` and `release/tauri/linux`. See [desktop builds](docs/platforms/desktop-builds.md) for prerequisites, output paths and verification status.

Code organization is documented in [Codebase structure](docs/architecture/codebase-structure.md).

## Workspace organization

Platform applications live in `apps/web`, `apps/windows`, `apps/mac` and `apps/linux`. Shared UI, domain, adapters and the Rust shell live in `packages`. `backend` is reserved documentation only.

See [codebase structure](docs/architecture/codebase-structure.md), [development setup](docs/development/setup.md), [current status](status/STATUS.md), [planning](planning/IMPLEMENTATION_PLAN.md) and [required infrastructure](infra/REQUIRED_INFRA.md). Root commands use pnpm; workspaces share one frozen pnpm lockfile.

Deployment artifacts use pinned pnpm 12.10.1. See [deployment operations](infra/deployment/README.md) and the [dependency review](docs/security/dependency-review-2026-10-09.md).
