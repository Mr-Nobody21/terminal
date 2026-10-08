# Canonical model

Reconstructed guidance from IMPLEMENTATION_PLAN.md.

Version 1 is the initial persisted format. Reject future versions; introduce explicit migrations when changing persisted contracts. Stable UUIDs identify all entities. Architecture resources, connections, and nested boundaries are authoritative; diagram positions are optional presentation metadata. AI proposals cannot provide positions. Inputs reference facts, assumptions, or catalog constants. Validate references before storage, pricing, rendering, and export. Duplication remaps every identifier and reference.

Contract impact review: diagram projects resources and boundaries; pricing reads configuration and input provenance; AI validates proposals against the same architecture schema; storage saves validated snapshots; exports derive from validated snapshots. Initial version has no historical migrations. Round-trip and rejection tests are required.

## Independent drawing documents (2026-10-08)

The independent drawings were introduced without changing the then-current version 1 cloud schema. Cloud projects now use version 3; the history and latest changes are described below. The user-requested flowchart, sequence, ER and infrastructure editors use a separate strict `Drawing` contract in `packages/domain/src/drawings/model.ts`: version, UUID, owning project UUID, kind, title, timestamp, nodes and connectors. Shape compatibility, unique IDs, asset references, endpoints and ER cardinality are validated. Unknown future drawing versions are rejected.

Backward compatibility: existing project JSON and the existing `cloud-planner-v1` IndexedDB database remain untouched. A separate `planner-drawings-v1` database stores new documents; there is no historical drawing format to migrate. Future drawing contract changes require versioned migrations and tests. JSON round-trip, duplication and transactional-import tests cover the initial format.

Impact review: cloud diagram projection, pricing and AI structured output still consume only the original architecture contract. Additional diagrams project their own validated documents and never enter pricing or AI output. Storage is separate and linked by project UUID; project copy/delete operations include associated drawings. New pure SVG/Draw.io serializers consume drawing documents and embed local assets. Cloud project JSON excludes drawings; independent drawing JSON is the portable source of truth for those editors.


## Version 2: cross-cloud architecture

Project provider and region are defaults. Each resource owns its provider and launch planning region. Resources from AWS, Azure, GCP, Oracle Cloud and IBM Cloud can coexist in a variant and connect across providers. Existing uniqueness, endpoint, boundary, provenance and coordinate-separation rules remain enforced. Additional directory entries use category `unsupported` and explicit unsupported placeholders until configuration and pricing are implemented.

`parseProject` migrates valid version 1 single-cloud projects to version 2 in memory, preserving every UUID, reference, position, timestamp, requirement and assumption. It first validates the full structure and still enforces version 1 provider/region restrictions. Invalid legacy cross-cloud files are rejected. Serialization writes version 2; future versions are rejected. The existing IndexedDB database name and table indexes remain unchanged so saved projects are discoverable. Reads migrate and the next successful save stores version 2. Separate Drawing documents remain version 1.

Impact review: diagrams already project resource-owned providers; palette and inspector now use the chosen/resource provider. Pricing matches per-resource provider/region and retains all formulas; absent rates remain unpriced, while cross-cloud links mark overall completeness false because connection transfer is not calculated. AI output remains curated to the selected default provider/region and is validated before replacing variants; it never generates coordinates or prices. Storage/import/export all pass through `parseProject`. Reports list resource provider and region; Draw.io/SVG resolve bundled Oracle/IBM icons and generic catalog fallbacks. Tests cover legacy migration, malformed legacy data, mixed-provider round-trip/duplication, storage reload, estimates and editable exports.


## Version 3 project modes and version 2 drawings

Project version 3 adds required `costEnabled: boolean`. Versions 1 and 2 migrate to version 3 with costs enabled; their IDs, references, configuration, presentation, requirements and timestamps are preserved. Version 1 restrictions are still checked before accepting the migrated snapshot. Existing storage database names/indexes are retained. New projects explicitly choose a mode; reports omit computed cost totals when disabled. The flag is a UI/report preference, not a resource semantic change. Canonical JSON and portable file payloads include the mode, while credentials/settings remain excluded.

Drawing version 2 adds image nodes with restricted local PNG/JPEG data URLs, positive bounded dimensions, labels and positions. Version 1 drawings migrate by changing only the version. Image nodes are allowed in flowchart/infrastructure documents; sequence and ER contracts retain their allowed shapes. Images live in presentation drawings, never architecture resources or AI structured output. The same graph projection includes image nodes for SVG/Draw.io/raster exports. Image nodes have no cloud price.

Impact review: diagram UI switches between cloud and simple surfaces according to persisted mode; cloud estimates and formula implementations remain unchanged. AI proposals continue validating canonical architecture variants only and preserve the owning project mode. Storage validates/migrates on read and writes latest versions. All interchange formats validate before committing; failed imports preserve the active architecture/drawing. Mermaid/XML embed canonical payloads with visible-text fingerprints to prevent stale payload restoration after text edits. Excel imports editable table changes into a cloned validated payload before commit. Reference bytes remain local and survive drawing duplication/JSON/export. Tests cover migration, strict credential exclusion, canonical round-trips, plain-syntax conversion, Excel edits, malformed inputs, mode reload, cancellation and raster downloads.


## Authenticated backend (2026-10-08)

No canonical format change: project version 3 and drawing version 2 remain current. Server account ownership, snapshot revisions and database assets are relational metadata. IndexedDB recovery caches now use per-account database names; the original databases remain available through an explicit local import. Runtime vendor SVGs are fetched into memory before rendering/export; embedded reference images remain portable drawing data and file imports additionally upload private database copies. Pricing and AI structured output remain unchanged. [ADR 002](decisions/ADR-002-authenticated-backend.md) supersedes the original no-backend scope.
