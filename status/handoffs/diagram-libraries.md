# Asset libraries and additional diagram types

Date: 2026-10-08

## Delivered

The Shapes palette now exposes existing AWS, Azure and Google Cloud icons, plus six selected Oracle Cloud, IBM Cloud, Kubernetes and original generic infrastructure assets each. Priced architecture projects remain provider-specific; selecting another supported provider can create a new blank project while preserving the previous project. Infrastructure diagrams mix all seven libraries without cost estimates.

The diagram selector adds manual flowcharts, sequence diagrams, ER diagrams and infrastructure diagrams. Flowcharts have process/decision/terminal/data shapes; sequence diagrams have participants, ordered messages and dashed replies; ER diagrams have attributes and explicit 1:1/1:N/N:M cardinality. Flowcharts, ER and infrastructure use the editable canvas with snapping and drag placement. Each type has independent history, local persistence and JSON import/export, plus SVG and editable Draw.io export.

## Files and decisions

- `packages/domain/src/drawings/`: separate strict version-1 drawing contract, validation, commands, layout, asset registry and tests.
- `packages/adapters/src/storage/drawings*`: validated local IndexedDB storage and transactional imports with ID collision protection.
- `packages/adapters/src/exports/drawings*`, `xml.ts`: escaped SVG/Draw.io serializers and shared XML escaping.
- `packages/ui/src/features/drawings/`: editor, local autosave queue, save-failure recovery and tests.
- `packages/ui/src/app/`, architecture palette, project toolbar and requirements panel: type selection, libraries, project-copy/delete integration and separation from cloud AI/pricing.
- `data/drawing-assets/`, `apps/web/public/drawing-assets/`: bundled icons, attribution manifest/checksums and upstream Kubernetes license.
- `tooling/scripts/assets/import-drawing-icons.py`: development-only official icon import/conversion.
- `tests/e2e/workspace.spec.ts`: cloud library and diagram-type acceptance flows.
- `docs/product/diagram-types.md`, feature list, attribution and canonical guidance: operation, scope, sources and backward compatibility.

Cloud canonical project format remains version 1 unchanged. New drawing documents have their own version-1 contract and IndexedDB database. This avoids treating visual shapes as priced resources and requires no migration of existing projects. New diagram JSON is exported separately from cloud project JSON. Pricing formulas and AI architecture output are unchanged.

## Validation

- `npm run lint`: passed.
- `npm test -- --run`: 96 tests passed across 17 files.
- `npm run build`: TypeScript and production web build passed.
- `npm run test:e2e`: 20 browser scenarios passed, including all original workflows and new library/type/drag flows.
- Contract rejection, JSON round-trip, duplication, storage recovery, ID collisions, asset XML and editable export structure tested.
- Sequence and ER screenshots reviewed; documentation links and whitespace checks passed.
- Existing nonfatal dependency annotation and large-chunk warnings remain. Native installers and manual Draw.io import were not rerun.

## Known limits and next work

New diagram types are manual and export JSON/SVG/Draw.io only; cloud architecture retains the existing eight formats. Sequence activation bars/fragments/self-messages, crow's-foot notation, SQL/schema generation and prices for Oracle/IBM/Kubernetes are not implemented. Native installers have not been rebuilt. Representative Draw.io importer verification remains manual. Optional next work is richer sequence/ER notation and a project bundle containing every associated drawing.
