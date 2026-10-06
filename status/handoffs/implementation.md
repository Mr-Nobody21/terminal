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

## Requested Rust Mac desktop extension

The user requested replacing Electron with a Rust desktop build on `feat/next-implementation`. Tauri 2 now hosts the React application in macOS WebKit, with native export save dialogs, restricted navigation, local IndexedDB and memory-only API keys. Electron source, dependencies and test configuration were removed. Canonical model version and pricing formulas are unchanged. See [Mac desktop handoff](../../docs/platforms/mac.md) for build instructions, source changes, storage migration and validation limitations. No publishing, backend, paid resources or automatic project migration were introduced.

## Requested Windows and Linux packaging

Added native Windows x64 EXE/MSI and Linux x64 AppImage/DEB build profiles, platform icons, a portable CLI launcher, correct Windows local-origin policy, isolated native smoke support and an implementation-branch build workflow. See [desktop build handoff](../../docs/platforms/desktop-builds.md). Windows/Linux installers require executing that workflow or the commands on native hosts; they are not yet generated. No remote write or workflow run has occurred.

## Collapsible workspace panels

Requirements (01) and Monthly estimate (03) now collapse independently using accessible expand/collapse buttons. Collapsed desktop panels become narrow rails and the architecture canvas grows; stacked layouts retain horizontal controls. Panel contents stay mounted, preserving form and detail state. Collapse state is session UI state and does not change canonical JSON, pricing or stored projects.

Changed `src/App.tsx`, `src/style.css`, added `src/components/CollapsiblePanel.tsx`, and added browser acceptance coverage in `e2e/workspace.spec.ts`. Passed lint, all 59 unit tests, static build and all 8 browser tests, including keyboard toggling, independent collapse, retained requirements/cost values, canvas width and mobile layout. Windows/Linux build execution remains pending approval of the previously prepared GitHub push/workflow.

Rebuilt the Apple Silicon Mac app and DMG with this UI change; app code-signature verification passed. Existing Windows/Linux workflow remains unexecuted.

## OpenRouter and additional BYOK services

Added OpenRouter/Groq presets and custom OpenAI-compatible hosted endpoints through a shared provider registry. AI settings include provider-specific endpoint/model guidance and optional JSON mode; provider/endpoint changes clear keys. The existing strict output/semantic validation and bounded repair apply to every service. Prior preferences remain readable, projects and pricing schemas are unchanged, and no new dependency or proxy was introduced. Changed the AI adapter/settings, added `src/features/ai/providers.ts`, extended adapter/hook/browser tests, updated `src/style.css` and [AI guidance](../../docs/product/ai.md).

Validation passed: lint, 73 Vitest cases, strict TypeScript/static build and all 11 browser E2E cases. New mocked end-to-end extraction/two-variant/export flows cover OpenRouter, Groq and custom compatible endpoints. Adapter fixtures verify endpoint/authentication/JSON contracts, unsafe-endpoint rejection, old/new preference round-trips and JSON-mode opt-out. Hook/browser checks cover key clearing and credential exclusion. No paid provider calls were used. Live hosted-provider CORS/account access and native save-panel interaction remain manual checks; Windows/Linux runner execution remains pending its prior approval.

The Mac app/DMG was rebuilt with the new BYOK settings; code signature and installer checksum verification passed. The next check is a user-submitted request with their selected endpoint/model/key; no live credentials are needed for automated tests.

## Fullscreen correction

Added an explicit Full screen / Exit full screen header control, F11 toggling, actual native fullscreen read/set commands for the invoking Tauri window, and browser Fullscreen API fallback. Window resizing/maximizing are explicitly enabled. Controls synchronize with native resize/browser fullscreen-change events and wait for asynchronous Mac Spaces transitions; errors remain recoverable. Fullscreen removes the workspace width cap and grows the diagram with the available viewport height. Canonical project data and credentials are unchanged.

Changed `src/App.tsx`, `src/style.css`, `src-tauri/src/main.rs` and native smoke coverage; added `src/features/workspace/fullscreen.ts`, `useFullscreen.ts` and helper tests; extended browser fullscreen coverage in `e2e/workspace.spec.ts`. Lint, 77 unit cases and all 12 browser tests pass. Native fullscreen round-trip verification and the rebuilt Mac installer follow.

Actual Mac WKWebView native smoke verification passed on two isolated launches, each entering fullscreen and exiting through the UI while checking the native window state. Project reload recovery and JSON/PNG/ZIP export checks still pass. The four Rust domain tests passed; native build includes strict TypeScript validation. Windows/Linux runner execution remains pending its prior approval.

The native suite also passed fullscreen changes initiated outside the React toggle, exercising resize/transition synchronization. Linux CI smoke setup now includes an Openbox window manager under Xvfb so its fullscreen operations have a real window manager; actionlint and shell syntax checks pass. Those Linux/Windows jobs remain unexecuted locally.

Final Mac app/DMG rebuilt with fullscreen changes; code signature and DMG checksum verification passed. Install the latest generated app to use the header Full screen / Exit full screen control. Remaining limitations are unchanged: ad-hoc signing, pending native Windows/Linux builds, and manual installed-package/save-dialog checks.

## Codebase restructuring — 2026-10-07

Moved the canonical model, cloud registry and samples from `src/core` to `src/domain`, and moved history into `src/app/state`. Replaced the root App with `src/app/App.tsx` composition and `src/app/useWorkspace.ts` session coordination. Extracted project, requirements, architecture and cost panels into their respective feature folders. Moved application CSS into `src/app` and the reusable collapsible panel into `src/shared/components`. Updated every source/test import and documented ownership in [Codebase structure](../../docs/architecture/codebase-structure.md).

No contract, database name, estimate formula, credential policy or desktop behavior changes; version 1 projects need no migration. Settings navigation preserves session UI state and credentials through the mounted controller. Existing user changes and prior desktop work were retained.

Validation: lint, all 77 unit tests, strict TypeScript/production build and all 13 browser acceptance tests passed. Added route-navigation retention coverage. Existing nonfatal dependency annotation and large-bundle warnings remain. Native installers were not regenerated for this structural refactor; native Windows/Linux build execution remains pending its previous authorization. Recommended next work: use the documented ownership when adding features; run platform build verification when producing installers.

## Platform/workspace organization — 2026-10-07

Adopted the user-approved folder structure with `apps/web`, `apps/windows`, `apps/mac`, `apps/linux`, shared `packages/ui`, `packages/domain`, `packages/adapters` and `packages/desktop`, and a reserved backend documentation folder. Added npm workspace manifests and source exports; retained one root lockfile and existing root command names. The web app now outputs `apps/web/dist`. Platform Tauri overlays/assets/tests live with each app; the shared launcher sets frontend/shell roots explicitly and works from workspace directories. Rust native commands, navigation rules and unit tests have their own modules/folders. Shared domain edit commands moved without changing their API or validation.

Moved icon/pricing provenance into `data`, build/packaging/test scripts into `tooling`, browser/setup tests into `tests`, guidance into grouped `docs`, phase plans into `planning` and handoff/status reporting into `status`. Added current status, roadmap/backlog/acceptance documents and required-infrastructure/local-tool/runner/signing guidance in `infra`. Root instruction pointers remain readable; AGENTS.md is unchanged. Bootstrap delegates to its relocated implementation and follows the moved guidance. CI path filters and native smoke invocations reference the new paths.

Validation passed: clean npm workspace install, lint, 77 unit tests, strict TypeScript/production build, all 13 browser flows, 8 packaging/workspace tests, actionlint, shell syntax, Rust formatting and all 4 Rust tests. The isolated native Mac app built and passed both launches, including fullscreen synchronization, persistence and JSON/PNG/ZIP content verification. The old Rust build cache contained absolute pre-move permission paths; it was preserved under ignored `.runtime/tauri-target-before-workspace-move` and rebuilt at the new location.

Project schema version 1, stable IDs, IndexedDB database, pricing formulas and AI/export contracts are unchanged; no migration is required. No backend service, new paid dependency, remote write, deployment or production installer publication occurred. Existing Windows/Linux native delivery and manual importer/save-dialog/signing checks remain pending. Existing release DMGs are preserved; this refactor produced an isolated debug smoke app rather than a new release installer. Next recommendation: complete native Windows/Linux verification on the previously prepared runners once authorized.

## Pending desktop builds completed — 2026-10-07

Committed the prepared workspace/desktop changes and pushed `feat/next-implementation` following the user's build request and push approval. The first native workflow produced Linux installers but found that direct Windows Cargo tests lacked the Windows icon overlay. Changed `tooling/scripts/build/tauri.mjs` and `tooling/scripts/packaging/desktop-build.mjs` to apply host `TAURI_CONFIG` to Cargo tests; added a Windows ICO regression fixture in `desktop-build.test.mjs`. The correction is commit `5149c00`.

The [subsequent workflow](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062) passed on Windows Server 2022 and Ubuntu 22.04: lint, 77 unit tests, 13 browser scenarios, 9 packaging checks, 4 Rust tests per OS, two native launches with persistence/fullscreen/icons/export validation, and production installer generation/upload. Downloaded Windows EXE/MSI and Linux AppImage/DEB locally. Mac app/DMG rebuilt from the same source and passed code-signature and disk-image checks. Verified installer headers, Linux DEB control metadata/production ELF payload and production smoke-hook exclusion; recorded artifact byte sizes and SHA-256 values in ignored release manifests.

Updated current status, validation, known issues, roadmap/backlog, platform docs, runner guidance and README. Canonical schema, pricing and project storage are unchanged. No main merge, GitHub Release, deployment, backend or paid resources were added. Build artifacts are ignored and remain available locally; CI downloads are retained for seven days.

All pending build jobs are complete. Next recommendation: perform interactive installed-package/save-dialog checks and manual Draw.io/Visio importer compatibility checks. Production signing remains optional future distribution work; Windows is unsigned and Mac ad-hoc signed/unnotarized.
