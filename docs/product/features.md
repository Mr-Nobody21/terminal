# Feature list

Implemented MVP capabilities for version 0.1.0, reviewed 2026-10-08. This inventory distinguishes available functionality from verification limits and deferred scope.

## Platforms and workspace

| Platform | Application | Build output |
|---|---|---|
| Web | Static React application with hash routing | Static web assets |
| macOS ARM64 | Tauri/Rust desktop application | `.app`, `.dmg` |
| Windows x64 | Tauri/Rust desktop application | NSIS `.exe`, `.msi` |
| Linux x64 | Tauri/Rust desktop application | `.AppImage`, `.deb` |

- Canvas-first workspace with a compact project header and on-demand requirements, pricing and export panels.
- Expandable left navigation with labels, saved expansion preference and keyboard controls.
- Fullscreen toggle and F11 shortcut, using browser or native desktop fullscreen controls.
- Responsive layout, diagram pan/zoom, selection and dragging.
- Manual planning without API credentials or network requests once application assets are available.
- Account-scoped local recovery with a separate backend for login, assets and explicit account snapshots (supersedes the original backendless MVP).

See [desktop builds](../platforms/desktop-builds.md) for outputs and platform prerequisites. macOS builds are ad-hoc signed and unnotarized; Windows installers are unsigned. Automated native smoke tests passed on all three desktop platforms; interactive installer and save-dialog checks remain manual.

## Projects and local persistence

- Choose cost planning or simple diagrams on first launch and when creating blank/example projects; retain the choice per project.
- Create projects from provider-specific examples; list, switch and rename projects.
- Duplicate projects with new IDs and consistently remapped references.
- Delete projects after confirmation.
- Debounced IndexedDB autosave and recovery after reload.
- Keep the current project in memory when saving fails and offer JSON recovery download.
- Import and export versioned canonical project JSON while retaining imported IDs.
- Validate schemas, unique IDs, references, provider compatibility and boundary containment; reject unknown future format versions.
- Transactional import: invalid input leaves existing projects untouched.
- Undo/redo architecture and presentation edits, including keyboard shortcuts outside text editors.

## Requirements and optional AI assistance

- Enter requirements directly or paste PRD text.
- Extract facts, unknowns and explicit assumptions with source labels.
- Rank up to eight clarification questions by architecture and cost impact.
- Answer questions or record assumptions; resolve critical unknowns before AI generation.
- Edit workload assumptions and retain input provenance for estimates.
- Generate Lean and Recommended architecture variants for the selected provider and region.
- Validate both proposed variants before committing; failed generation preserves the existing project.

### Bring your own API key

| Connection | Support |
|---|---|
| OpenAI | Provider adapter and preset |
| OpenRouter | OpenAI-compatible preset |
| Groq | OpenAI-compatible preset |
| Anthropic | Provider adapter |
| Google Gemini | Provider adapter |
| Custom compatible service | Configurable OpenAI-compatible HTTPS endpoint |
| Local model server | OpenAI-compatible localhost endpoint, including local HTTP |

- Configure endpoint, model and optional JSON mode; store preferences separately from projects.
- Keep API keys in memory only and exclude them from saved projects and exports. Reloading clears credentials.
- Submit requests directly from the browser only after user action, with disclosure of outgoing requirements and possible provider charges.
- Handle cancellation, timeouts, authentication failures, rate limits and connection/CORS errors.
- Validate structured responses with schema and semantic checks; permit one bounded repair request for invalid output.
- AI proposes canonical architecture JSON; application code supplies layout, pricing and export formats.

Provider tests use mocked responses and require no paid calls. Live connectivity depends on provider account access, model availability and browser connection policies. See [AI behavior and privacy](ai.md).

## Cloud service catalog

The registry includes 36 services with bundled provider icons and a generic fallback.

| Provider | Launch region | Services |
|---|---|---|
| AWS | `us-east-1` | EC2, ECS/Fargate, Lambda, RDS PostgreSQL, DynamoDB, S3, CloudFront, Application Load Balancer, ElastiCache, SQS, Route 53, Secrets Manager |
| Azure | `eastus` | Virtual Machines, Container Apps, Functions, Database for PostgreSQL, Cosmos DB, Blob Storage, Front Door/CDN, Application Gateway, Cache for Redis, Service Bus, Azure DNS, Key Vault |
| GCP | `us-central1` | Compute Engine, Cloud Run, Cloud Functions, Cloud SQL, Firestore, Cloud Storage, Cloud CDN, Cloud Load Balancing, Memorystore, Pub/Sub, Cloud DNS, Secret Manager |

Catalog availability does not imply complete pricing support. Unsupported services can remain explicit placeholders and unpriced until replaced through the inspector. Icon attribution is recorded in [icon sources and licenses](../../data/attribution/icons.md).

## Architecture diagram and editing

- Contextual manual workspace with a floating searchable provider service palette, canvas tools and selection properties.
- Click a service to add it or drag it to a chosen canvas position.
- Select and pan modes, optional 20-unit grid snapping and arrowed connectors.
- The canvas fills the workspace by default; panels open on demand, retain edits and dismiss with close controls or Escape.
- Service properties appear on selection; CPU/memory inputs are immediately available where applicable and advanced fields expand under More settings.
- Create a blank Manual variant without removing existing architecture variants.

- Project canonical resources and connections into an editable React Flow canvas.
- Generate deterministic ELK layouts with nested cloud/network boundaries.
- Persist user-adjusted positions separately from infrastructure semantics.
- Add, configure and delete resources; deleting a resource also removes incident connections atomically.
- Create, edit and delete connections and boundaries through canonical-model commands.
- Edit service configurations, boundary membership, workload inputs and their sources through the inspector.
- Switch architecture variants and rerun automatic layout.
- Reject invalid endpoints, incompatible configurations and cyclic boundary containment.
- Recalculate diagram projections and estimates after committed edits or undo/redo.

See [canonical model](../architecture/canonical-model.md).

## Additional diagram types

- Flowcharts with process, decision, terminal and input/output shapes.
- Sequence diagrams with participants, ordered messages and dashed replies.
- ER diagrams with attributes and explicit relationship cardinality.
- Unpriced infrastructure diagrams mixing AWS, Azure, GCP, Oracle Cloud, IBM Cloud, Kubernetes and generic assets.
- Independent local persistence, history and JSON import/export; editable SVG and Draw.io output.

See [diagram types and asset libraries](diagram-types.md) for scope, separate JSON backups and limitations.

## Deterministic cost estimates

- Calculate USD estimates locally using checked-in rates and pure formulas.
- Model instance-hours, container CPU/memory-hours, serverless requests/execution, database compute/storage, object storage, egress and load balancers where supported rates exist.
- Use a documented 730-hour month default and trace inputs to facts, explicit assumptions or catalog constants.
- Show low/base/high totals from explicit workload scenarios; show equal bounds and a warning when variability is absent.
- Show resource, category and environment totals with formula details, provenance and pricing source links.
- Preserve known subtotals and display estimate completeness; missing rates or inputs remain unpriced rather than becoming zero.
- Recalculate immediately after configuration or assumption changes.

Pricing is a bounded snapshot estimate, not a complete cloud bill. Taxes, credits, free-tier benefits and negotiated discounts are excluded; additional service components and tier limits are disclosed. See [pricing formulas and coverage](pricing.md).

## Exports and reports

| Format | Capability |
|---|---|
| JSON | Portable canonical project with version and stable IDs |
| Draw.io XML | Editable service nodes, labels, connectors and boundary groups; embedded bundled icons |
| SVG | Vector diagram from the shared graph projection |
| PNG / JPEG | Raster diagrams; import either as movable reference images |
| Mermaid | Native diagram syntax plus round-trip planner metadata; supported plain-syntax imports |
| XML | Planner-aware editable Draw.io XML export and uncompressed Draw.io import |
| Excel XLSX | Editable diagram table, canonical data, and cost overview; validated template reimport |
| PDF | Active diagram and architecture report |
| Markdown | Editable text report |
| DOCX | Editable Word report |
| ZIP | Bundle of available exports |

- Reports include requirements, variants, assumptions, pricing provenance and completeness warnings.
- Exports use validated project data, shared layout and saved positions, with format-appropriate text escaping.
- Download in the browser or save to a user-selected file in desktop applications.
- Native file saving validates filenames and enforces a 128 MiB payload limit.

Draw.io and Visio importer compatibility still requires representative manual verification. Native VSDX export is not implemented. PDF uses standard Helvetica and substitutes unsupported characters with `?`; other text formats retain Unicode. ZIP includes PNG when canvas rendering is available. See [export behavior and limitations](exports.md).

## Verification and deferred scope

Automated coverage includes domain validation, pricing fixtures, diagram layout, AI failure/repair paths, persistence, export structure, browser workflows, packaging and native desktop smoke tests. Current results and remaining checks are tracked in [status](../../status/STATUS.md) and [known issues](../../status/known-issues.md).

The following are deferred: PWA installation/offline shell, native VSDX, cloud account discovery, Terraform generation or deployment, collaborative editing, accounts/teams, billing/subscriptions, hosted project storage, compliance scanning, live FinOps ingestion, infrastructure drift detection, deep Kubernetes modeling and mobile applications. Production signing/notarization and deployment are separate distribution work.

See the [implementation plan](../../planning/IMPLEMENTATION_PLAN.md), [codebase structure](../architecture/codebase-structure.md) and [required infrastructure](../../infra/REQUIRED_INFRA.md) for scope and maintenance guidance.


### Cross-cloud infrastructure and service inventories

One architecture can combine AWS, Azure, Google Cloud, Oracle Cloud and IBM Cloud resources, with editable cross-cloud connections and resource-specific provider/region metadata. Cost views show provider subtotals. Existing verified rates remain bounded to AWS/Azure/GCP launch catalogs; Oracle/IBM and additional directory entries are unpriced. Cross-cloud transfer/interconnect charges are explicitly unpriced.

[Official inventory snapshots](service-inventories.md) contain 1,137 entries across the five providers (API namespaces or directory entries, depending on the source). These expand search and placement beyond the original configured services; core vendor icons are retained and other entries use a local fallback. Existing version 1/2 projects migrate to version 3 without losing IDs or positions.

See [project modes and file exchange](project-modes-and-files.md) for format coverage, file limits and editing guidance.

## Accounts and backend assets (2026-10-08)

- Separate Fastify backend and PostgreSQL schema/migration runner in the same repository.
- Email/password registration and sign-in, HttpOnly sessions, logout, expiry and password-change API; disabled Google sign-in placeholder.
- Runtime vendor SVGs moved to backend source seeds and PostgreSQL blob storage; frontend catalog cache keeps editable exports self-contained.
- Private PNG/JPEG uploads, ownership checks, deduplicated image bytes and project-to-asset references. Account saves ingest embedded legacy images transactionally.
- Explicit account project save/list/load/delete with revision conflict checks; per-account IndexedDB recovery caches and opt-in import of previous device projects.
- Backend health/readiness, CORS allowlist, CSRF header/origin checks, body limits and authentication rate limits.
- No real Google OAuth, S3 bucket, password-reset email, email verification, enrolled authenticator MFA or deployment. Current web UI requires a running backend; desktop releases must be rebuilt/configured for the new API.

## OTP verification and security pass (2026-10-09)

- Separate password and verification-code steps for both registration and login; the requested development code is `904530`. Password-only requests cannot access projects/assets.
- Five-minute challenges, five guesses, single-use challenge consumption, expiry/restart UI and login cooldowns. The shared fixed code is a demonstration, not real enrolled MFA; production configuration is blocked.
- Persistent account/IP auth throttles, aggregate/endpoint rate limits, bounded concurrent password hashing, stronger versioned scrypt hashes with legacy upgrades, session idle timeout/caps/rotation and password-change revocation.
- Security headers/CSP, bounded requests/uploads/storage, query/API timeouts, security audit events and retention.
- Catalog read caching/coalescing and duplicate-upload write avoidance.
- See [security review](../security/review-2026-10-09.md) for current limits, residual risks and validation scope.
