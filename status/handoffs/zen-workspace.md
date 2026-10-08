# Contextual workspace and expandable navigation

Date: 2026-10-08

## Delivered

Implemented the selected Contextual calm concept in the shared UI. The canvas fills the workspace with a compact project/cost/export header. A left icon rail expands to show labels; its preference is stored independently of projects and remains usable when localStorage is unavailable. Shapes, requirements, costs and projects open on demand. Export formats live behind one header button. Service properties appear on selection with direct CPU/memory controls where relevant and expandable advanced settings. Panels close with explicit controls or Escape.

The same components continue to edit the canonical project, preserve autosave, use deterministic pricing and support manual work without credentials. Editor controls retain their state while visiting AI settings. No schema, pricing formula, backend or dependency changes were needed.

## Changed files

- `packages/ui/src/app/App.tsx`: contextual shell, expandable rail, on-demand panels and dismissal.
- `packages/ui/src/shared/components/NavigationIcon.tsx`: native SVG navigation icons.
- `packages/ui/src/features/architecture/ArchitecturePanel.tsx`: floating palette/properties and compact tool menu.
- `packages/ui/src/features/architecture/Inspector.tsx`: progressive disclosure of configuration details.
- `packages/ui/src/features/diagram/Diagram.tsx`: calmer initial viewport.
- `packages/ui/src/features/pricing/CostPanel.tsx`: remove repeated export controls.
- `packages/ui/src/styles/application.css`: contextual shell and responsive styling.
- `tests/e2e/workspace.spec.ts`: adapt existing acceptance paths and test navigation, dismissal and panel state.
- `packages/desktop/src/smoke.js`: navigate project/export panels in the existing native smoke flow.
- `docs/product/features.md`, `docs/platforms/web.md`: current UI behavior.

## Validation

- `npm run lint`: passed.
- `npm test -- --run`: 77 tests passed.
- `npm run build`: production web build and TypeScript checks passed.
- `npm run test:e2e`: 14 browser scenarios passed, including keyboard navigation expansion, reload preference, Escape dismissal, panel state, AI workflows and all exports.
- Desktop smoke script syntax checked; native installer builds and native smoke execution were not rerun.
- Normal canvas, floating-panel and narrow-screen screenshots reviewed. Existing nonfatal build warnings remain.

## Known limits and next work

Floating panels can cover diagram content; close them or pan the canvas when needed. Native installers need rebuilding before distributing the new shared UI. This change does not implement freeform drawing or new export formats. Optional next work is testing the new controls with representative user architectures.
