# Codebase structure

The repository is an npm workspace with four platform folders and shared TypeScript/Rust packages.

```text
apps/
  web/           React entry, Vite config, API proxy, static UI build
  windows/       Windows configuration, ICO assets, installer policy, tests
  mac/           macOS configuration, ICNS assets, signing policy, tests
  linux/         Linux configuration, PNG assets, packaging policy, tests
packages/
  ui/src/        App composition, history, feature panels, shared hooks and styles
  domain/src/    Canonical model, commands, providers, examples, pricing and layout
  adapters/src/ AI requests/extraction, IndexedDB, exports, native/browser bridges
  desktop/      Shared Rust/Tauri application and native commands
backend/        Fastify API, auth/assets/projects, PostgreSQL migrations and SVG seed sources
data/          Pricing snapshots, service inventory and attribution
docs/          Architecture, development, platform and product guidance
planning/      Implementation plan, roadmap, backlog, acceptance criteria
status/        Current progress, known issues, validation and handoffs
infra/         Required infrastructure, local tools, build runners and signing
tooling/       Shared configuration and build/packaging/test scripts
tests/         End-to-end scenarios, integration setup and fixture guidance
```

The same UI runs in the web browser and all three desktop webviews. Each platform owns configuration/assets/packaging in its app folder. `packages/desktop` hosts the shared Rust shell and consumes `apps/web/dist`; it does not contain a second UI or a network backend. Platform-specific UI differences, if needed, belong in the relevant app folder and should reuse the shared UI.

Cross-package TypeScript imports use the declared `@planner/ui`, `@planner/domain` and `@planner/adapters` exports. Imports within a package remain relative. Packages expose TypeScript source for Vite and the strict root type check; they are private application workspaces, not published libraries. `pnpm install --frozen-lockfile` installs all workspace links using one root lockfile.

Dependency direction: the web entry consumes UI; UI consumes domain and adapters; adapters consume domain. Domain does not import React, storage or desktop APIs. Pure ELK graph projection lives in domain because the UI and exporters share it. AI orchestration belongs in adapters because it calls providers. Pricing arithmetic remains in domain.

`packages/ui/src/app/useWorkspace.ts` stays mounted across hash routes. It coordinates project lifecycle, autosave and session UI state, retaining memory-only credentials during navigation. Feature panels receive typed subsets of its controller. Canonical contracts are in `packages/domain/src/model/model.ts`, with edit commands in `src/commands/project.ts`. The public model entry re-exports both, preserving the existing API and validation.

Runtime image sources live only under `backend/assets`; a seed command stores them in PostgreSQL. UI/adapters fetch the catalog once and reuse the in-memory bytes for rendering and exports. Platform launcher icons remain build inputs in each platform folder. See [ADR 002](decisions/ADR-002-authenticated-backend.md) for the current backend scope.

Tests are colocated with TypeScript modules. Platform configuration tests live under each app's `tests` folder; browser flows and shared setup live under root `tests`. Build outputs, Rust targets, runtimes and reports are ignored.

This reorganization preserves project version 1, entity IDs, IndexedDB names, pricing formulas and export formats. No data migration is necessary. Root guidance pointers remain for AGENTS.md and older handoffs; their complete contents now live in the grouped documentation folders.


The server is a separate workspace and imports shared domain validation, never React or UI code. Authenticated ownership lives in database metadata rather than canonical architecture JSON. Per-account IndexedDB caches preserve local recovery.
