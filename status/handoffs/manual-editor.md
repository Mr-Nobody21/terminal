# Manual architecture editor

Date: 2026-10-08

## Delivered

The shared web/desktop UI now offers a Draw.io-style service palette, drawing canvas and properties panel. Services can be searched, added with a click or dropped at a canvas position. The toolbar provides select/pan modes, undo/redo, automatic layout, optional 20-unit grid snapping, boundary creation and a new blank Manual variant. Focus mode gives the editor the workspace width; narrow layouts move properties below the canvas.

All edits still use validated canonical project commands. Dropped positions remain presentation metadata, autosave and exports use the existing model, and blank variants preserve earlier variants. The canonical schema, pricing formulas and native shell are unchanged.

## Files

- `packages/ui/src/features/architecture/ArchitecturePanel.tsx`: palette, tools, focus mode, blank variants and properties layout.
- `packages/ui/src/features/diagram/Diagram.tsx`: drop coordinates, grid snapping, pan/select behavior and arrowed connectors.
- `packages/ui/src/styles/application.css`: responsive manual editor styling.
- `tests/e2e/workspace.spec.ts`: manual editing, drop, history, persistence, blank variant and narrow-screen regression coverage.
- `docs/product/features.md`: feature inventory updated.

## Validation

- `npm run lint`: passed.
- `npm test -- --run`: 77 tests passed.
- `npm run build`: passed; existing dependency-annotation and large-chunk warnings remain nonfatal.
- `npm run test:e2e`: 14 scenarios passed, including the new manual editor acceptance flow.
- Browser screenshots captured for the normal workspace and focus editor for visual review.

## Limits and next work

This is a cloud architecture editor with familiar drawing controls, not a full Draw.io replacement. Freeform drawing, arbitrary shape libraries and native VSDX remain outside this change. Native installers must be rebuilt separately to distribute this UI update; this task verifies the shared UI and static production build.
