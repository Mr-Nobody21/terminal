# MVP implementation handoff

Implemented 2026-10-06 in the existing repository. Original README content and AGENTS.md are preserved. Three missing guidance documents were reconstructed from IMPLEMENTATION_PLAN.md, with that provenance stated explicitly. No custom project skills were available. No backend, auth, application proxy, hosted storage, deployment or paid resources were added.

## Phase handoffs

| Phase | Files / major decisions | Validation / remaining issues | Recommended next phase |
| --- | --- | --- | --- |
| 0 Foundation | package.json, package-lock.json, strict tsconfig, Vite/ESLint/Vitest/Playwright configuration, main.tsx, style.css, reconstructed ADR, corrected codex_handoff.sh. Supported workspace-local Node 22 runtime, ignored by Git. Hash navigation and relative asset base. | Initial lint, 14 tests, build and browser smoke passed. Local server/browser execution requires sandbox escalation in this environment. | Canonical model |
| 1 Canonical model | core/model.ts, providers.ts, sample.ts, history.ts, storage/repository.ts. Strict version 1 contracts, UUIDs, referential validation, compatible services/regions, cycles, commands, transactional import, remapped duplication. Presentation separate. | Model round-trip, invalid pairs/IDs/provenance, future-version rejection, atomic deletion, storage and undo/redo tests. Initial format has no earlier migrations; future schema changes need explicit migration. | Catalog and icons |
| 2 Provider catalog | core/providers.ts, public/icons/*, data/icons.ts, data/icon-assets/*, docs/ICON_ATTRIBUTION.md. Twelve registered services per provider, official local SVGs, manifest, generic fallback. | Every registered service has a bundled SVG; unsupported fallback tested. Public assets serve the canvas; source copies embed in exports. Vendor marks retain vendor ownership. | Diagram |
| 3 Diagram | features/diagram/*, architecture/Inspector.tsx, App.tsx. Sorted ELK graph, nested boundaries, React Flow projection, canonical add/delete/connect, selection and inspector, persisted positions, capped 50-step history. | Deterministic/nested layout, drag override, atomic connected deletion, history and inspector tests. Browser pan/zoom/drag and persistence tested. Layout is asynchronous with stale-result protection. | Pricing |
| 4 Pricing | features/pricing/*, data/pricing.ts, selected AWS/Azure snapshots, docs/PRICING.md. Seven pure formula families, strict rate/estimate schemas, provenance, exact seconds/hour conversion, explicit low/base/high workload multipliers. | Formula fixtures, catalog dimensions, missing units/rates/SKUs, scenarios, Fargate configurations, tiers and completeness tests. Catalog intentionally bounded to documented configurations; many service configurations and Azure/GCP internet transfer remain unpriced. Known subtotals are never presented as complete bills. | AI adapters |
| 5 BYOK adapters | features/ai/adapter.ts, AIControls.tsx, docs/AI.md. OpenAI-compatible, Anthropic, Gemini, local browser adapters. Key held in React memory only; preferences contain only endpoint/model/provider. | Mocked envelopes, authentication, rate limiting, network restrictions, timeout, cancellation, bounded repair and credential exclusion tested. Actual paid provider calls not run. Browser CORS depends on endpoint. | Requirement clarification |
| 6 Requirements | features/requirements/engine.ts and controls in App.tsx. Pasted PRD, fact source labels, eight ranked questions, visible assumptions, explicit answers/assumptions for critical unknowns. | Ranking, source preservation, critical gating and stale project protection tests. Manual workflow needs no credentials. Inferred facts remain reviewable; model interpretation requires user judgment. | Variant generation |
| 7 Generation | requirements/engine.ts generation schema/prompts. Canonical Lean/Recommended only; shared validator rejects coordinates, bad services/references; commit both atomically. | All three cloud-provider mocked variant flows tested; failure retains architecture. Unsupported services are explicit and editable via catalog replacement. | Exports |
| 8 Exports | features/export/artifacts.ts, tests and README. Editable Draw.io nodes/connectors/groups with icons, SVG, browser PNG, diagram/report PDF, Markdown, DOCX, JSON, ZIP. | Parsed XML/SVG and escaping, report provenance and all variants, binary signatures, ZIP contents, JSON round-trip; all browser exports tested. Manual diagrams.net/Visio importer verification remains pending. PDF standard Helvetica replaces unsupported Unicode with `?`; other formats retain Unicode. | Local persistence/polish |
| 9 Polish | App.tsx, AIControls.tsx, style.css, repository and browser tests. Debounced autosave, projects/rename/duplicate/confirmed deletion, import/reload, save-failure JSON recovery, keyboard history, responsive workspace, privacy and example onboarding. Export libraries loaded on demand. | Browser manual/export and mocked AI flow, reload, unavailable IndexedDB recovery, project switching/cancellation. Optional PWA shell deferred as allowed; no deployment performed. | Finish manual compatibility gates; expand verified catalog within current architecture |

## Contracts and cost scope

Canonical version 1 is the first stored format. Diagram, AI, storage and export use the same strict validated model. Persisted positions belong to presentation; proposals cannot include them. Pricing validates the canonical project before calculation and requires each input to reference a requirement, an explicit assumption or an exact documented default. Catalog constants require exact values/units. Input edits create user assumptions. Changing a referenced numeric assumption to unknown text clears its numeric inputs, making relevant pricing incomplete rather than retaining contradictory numbers.

Month default is 730 hours. Formula units, source URLs, retrieved dates, SKUs, exclusions and exact official snapshot records are checked in. Workload bounds are explicit multipliers; no AI arithmetic is used. Without supplied variability, bounds equal base. The onboarding workload is explicitly per-resource and illustrative; shared traffic should be assigned only once in real projects. Unsupported services/rates and unsupported billing tiers remain unpriced with known subtotal retained.

## Running and validation

Use Node 22+:

```bash
npm ci
npx playwright install chromium
npm run check
npm run dev
```

For the provided ignored workspace runtime:

```bash
export PATH="$PWD/.runtime/bin:$PATH"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.runtime/browsers"
npm run check
```

All automated tests use local fixtures or mocked AI responses. No paid AI call is required. Static output is `dist/`; nothing was published. Large ELK/report chunks remain a build warning; report dependencies load only on export. Third-party Zod annotation warnings are harmless upstream build notices.

Final validation results are recorded below after the final run. The compatibility gate for native diagram import is deliberately not claimed as passed.

## Final validation results

- `npm run lint`: passed.
- `npm test -- --run`: 56 tests passed across 11 files.
- `npm run build`: passed; static output generated in `dist/`.
- `npm run test:e2e`: 7 browser tests passed, including every export, persistent dragging, reload recovery, all three cloud providers' mocked AI generation, failed AI isolation, blocked IndexedDB recovery and immediate project-switch persistence.
- `bash -n codex_handoff.sh` and `git diff --check`: passed.
- npm dependency audit after the final dependency installation: zero reported vulnerabilities. Vitest was upgraded to a patched release following the initial audit.

Project switches flush the current snapshot before opening another project. Failed saves preserve the active project; deletion cancels pending autosave to avoid recreating deleted records. Duplication remaps only entity/reference fields and position keys, preserving literal UUID text in user content. Unpriced resource rows display `Unpriced`, while incomplete categories retain labeled known subtotals.

Next task: manually verify representative editable Draw.io imports in diagrams.net and SVG imports in Visio, then expand verified provider catalog configurations and Unicode PDF font coverage. No release/deployment approval is requested; the repository contains the locally validated implementation and static build.
