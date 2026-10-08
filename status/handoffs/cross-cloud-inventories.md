# Cross-cloud infrastructure and official inventories

2026-10-08. Local implementation; no publishing or backend changes.

## Changes

- `packages/domain/src/providers/index.ts`, `data/services/inventory.json`, and `tooling/scripts/services/import-inventory.py`: five cloud providers, official directory/API inventory snapshots, refresh script, source scopes, retrieval dates and raw-source hashes. Inventories include AWS 436, Azure 196, Google Cloud 227, Oracle 171 and IBM 107 entries, totaling 1,137. Core configured service IDs are preserved; catalog-only services are unsupported/unpriced placeholders with fallback icons.
- `packages/domain/src/model/model.ts` and `examples/index.ts`: version 2 resource-owned provider/region validation and mixed-provider variants. Valid version 1 projects migrate without changing IDs, presentation or requirements. Malformed legacy cross-cloud data and future versions are rejected.
- Architecture palette, inspector and diagram: add services from different cloud libraries to the same project, connect them, retain provider/region metadata, show official references and preserve undo/redo. Additional services start collapsed to keep the canvas calm.
- Pricing and cost panel: formulas unchanged; provider subtotals and explicit unpriced cross-cloud transfer/interconnect warnings. Known resource totals remain available; cross-cloud connections make the overall estimate incomplete.
- Export adapters: local Oracle/IBM icons, catalog fallback icons, per-resource provider/region in reports and migrated version 2 JSON. AI continues using a curated catalog for the selected default provider/region; it does not receive the entire inventory or calculate prices.
- Documentation: `docs/product/service-inventories.md`, feature list, diagram guide and canonical-model migration/impact review. Existing uncommitted UI and diagram work retained.

## Verification

Lint, strict TypeScript/production build, 106 unit tests and 20 browser scenarios passed. Tests cover mixed-provider references, round-trip/duplication, version migration, IndexedDB recovery, pricing completeness, editable exports, five-provider palette/reload/JSON export, a catalog-only service and prior manual/AI/diagram workflows. Inventory importer syntax checked and replayed against downloaded official sources; its generated snapshot matches exactly.

## Limits and next work

Directory entries and SDK namespaces are not interchangeable commercial service counts; each source's coverage is documented. These snapshots cannot guarantee every provider product, account-specific offering or regional availability. Only launch planning regions are accepted. Existing verified rates remain bounded to AWS/Azure/GCP; additional service configurations and Oracle/IBM pricing are unpriced. Cross-cloud transfer/VPN/interconnect costs need explicit future calculators and rates. AI generation remains scoped to the project's default provider.

The static web ZIP is refreshed. Existing native installers were not rebuilt for this change. Draw.io/Visio interactive import verification remains outstanding; dependency annotation and bundle-size build warnings remain nonfatal. Next recommended work: choose high-priority catalog services for typed configuration and verified pricing, then rebuild native installers when requested.
