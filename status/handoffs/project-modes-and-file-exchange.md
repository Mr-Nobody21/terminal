# Project modes and file exchange

2026-10-08. Local implementation. No backend, network import service, paid resource or new runtime dependency.

## Changed files

- Project model/examples/tests, drawing model/tests, and storage migration tests: project version 3 with persisted cost choice; drawing version 2 with bounded PNG/JPEG reference nodes and explicit legacy migration.
- `packages/ui/src/features/projects/ProjectStart.tsx`, `ProjectToolbar.tsx`, `app/App.tsx`, `useWorkspace.ts`, and styles: first-launch/new-project/example mode dialogs; blank projects; cancel/busy/error states; persisted switching; cost UI visibility and simple diagram surface.
- `packages/adapters/src/exports/interchange.ts` and tests: Mermaid, planner-aware editable Draw.io XML, XLSX template exchange and raster conversion; local image signature/size checks; strict validation and workbook ZIP size bounds. Package exports expose the adapter.
- `features/exports/FileTransfers.tsx`, drawing editor, and drawing exports: file controls for all requested formats; movable/resizable/removable image references; image-aware SVG/Draw.io/PNG/JPEG outputs.
- Report adapter: cost-disabled reports omit computed cost totals.
- Product/model documentation, feature list and browser scenarios updated.

## Decisions

Costs are selected per project and preserved through save/export/duplication. Existing projects retain cost mode through migration. Simple mode opens independent infrastructure drawings and hides cost/requirements navigation; enabling costs reopens architecture estimates. Initial simple mode is blank. Project mode switches preserve existing architecture and separate drawings.

Mermaid/XML planner payloads retain full canonical data only when the visible document fingerprint matches. Edited/external syntax becomes a validated generic drawing, avoiding stale hidden configuration. XML scope is uncompressed Draw.io; Mermaid scope is documented flowchart/sequence/ER syntax. Raster imports are references, without topology/OCR inference. Excel uses a real OOXML workbook through the existing JSZip dependency, with editable resource rows, full validated data and a readable cost overview; it does not run Excel formulas. No LLM performs prices or XML generation.

## Validation

Lint, strict TypeScript/production build, 114 unit tests and 23 browser scenarios passed. Coverage includes mode selection/cancel/reload/switching, legacy migration, full-fidelity file round-trips, edited Mermaid, plain flowchart/sequence/ER conversion, XML escaping and grouping offsets, XLSX table edits and invalid input, credential exclusion, bounded ZIP decompression, image persistence and PNG/JPEG signatures. Existing manual, AI, cross-cloud and diagram workflows remain covered.

Web ZIP refreshed. Nonfatal dependency annotation/chunk size warnings remain. Native installers were not rebuilt. Interactive imports in external Draw.io/Excel/Mermaid applications remain manual verification work; generic XML conversion flattens groups and cannot preserve all external custom features. Legacy binary XLS/unrelated spreadsheets, compressed Draw.io, arbitrary Mermaid directives and raster-to-editable-architecture conversion are unsupported. Format details are in `docs/product/project-modes-and-files.md`.

Next recommended work: external-editor compatibility checks and native installer rebuilds when requested.
