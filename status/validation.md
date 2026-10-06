# Validation — workspace restructuring

Updated 2026-10-07. Automated AI checks use mocked responses; no paid calls.

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed: installs all workspaces from root lockfile |
| `npm run check` after clean install | Passed: lint, unit tests, build, browser tests and packaging checks |
| `npm run lint` | Passed |
| `npm test -- --run` | Passed: 77 cases across 13 files |
| `npm run build` | Passed: strict TypeScript and `apps/web/dist` output |
| `npm run test:e2e` | Passed: all 13 scenarios |
| `npm run test:packaging` | Passed: 8 platform/workspace/installer checks |
| Workflow actionlint | Passed |
| Bootstrap/Linux shell syntax | Passed |
| `npm run test:desktop` | Passed: 4 Rust tests and two native Mac launches; fullscreen, persistence and JSON/PNG/ZIP verified |
| Rust formatting | Passed |
| Native Windows/Linux build/run | Pending matching runners and prior authorization |
| Draw.io/Visio importer checks | Pending manual verification |

Browser scenarios cover manual sample/edit/history/import/export/reload, save recovery, project switching before debounce, mocked AI for AWS/Azure/GCP and hosted compatible endpoints, credential exclusion, collapsed panels, fullscreen and settings-navigation state retention.

Packaging checks verify each platform's owned configuration, installer types/policy, icon files, the shared shell's web distribution path, workspace source exports, dependency direction, native toolchain profiles and installer byte preservation.

Root npm scripts remain available and workspace commands resolve the new package paths. Canonical version 1, entity IDs, storage database name, pricing arithmetic and export format contracts remain unchanged. Existing nonfatal dependency annotation and large-chunk warnings are recorded in [known issues](known-issues.md).
