# Current status

Updated 2026-10-07.

The repository now uses npm workspaces with separate web, Windows, Mac and Linux app folders. Common React UI, canonical domain logic, adapters and the Rust/Tauri shell live in shared packages. Documentation, planning, status and infrastructure requirements have dedicated folders. The backend folder is reserved scope documentation only.

Completed application capabilities include manual architecture editing, deterministic estimates, local project persistence, BYOK AI (including OpenRouter/custom compatible endpoints), editable exports, collapsible requirements/cost panels and browser/native fullscreen controls.

The full `npm run check` also passed after a clean workspace install. Validation for the workspace move: lint, strict TypeScript/production web build, all 77 unit tests, all 13 browser acceptance tests and all 8 packaging/configuration tests pass. All four Rust tests and the two-launch native Mac smoke suite also pass at the relocated Rust path. See [validation](validation.md) for details.

Pending delivery checks: native Windows/Linux installer generation and acceptance, manual Draw.io/Visio import verification, installed native save-dialog checks and production signing if requested. No remote push, deployment, backend or paid resources were introduced.

See [structure](../docs/architecture/codebase-structure.md), [required infrastructure](../infra/REQUIRED_INFRA.md), [known issues](known-issues.md) and [handoff history](handoffs/implementation.md).
