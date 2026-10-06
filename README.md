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

The static React MVP now lives in this repository. See [implementation handoff](docs/IMPLEMENTATION_HANDOFF.md) for phase status, validation and known limits. Existing handoff text above is retained.

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

Projects autosave to IndexedDB on this browser origin. Export JSON before changing origin or clearing browser data. AI is optional: settings persist endpoint/model preferences; keys stay in memory. No AI calls occur until submission. Production files are generated under `dist/` by `npm run build`; hash navigation and relative assets support static hosting. No deployment has been performed.
