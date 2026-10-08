# Popup and menu spacing review — 2026-10-09

Reviewed application dialogs, menus, drawers, disclosures, inspectors and auth forms through Chromium Chrome DevTools Protocol and screenshots in desktop/mobile/dark appearance. Added a dedicated shared surface stylesheet and CSS entrypoint, with standard control heights, label gaps, drawer/menu padding, opaque backgrounds, responsive sizing and scrolling. Corrected mobile header clipping and inspector/connection-menu stacking. A shared measured notification band prevents import/error messages from covering close buttons, including persistent drawing-save warnings.

Added a shared confirmation provider/dialog and replaced browser confirmations for device/account deletion, snapshot replacement and legacy-project import. Defaults focus Cancel; Escape cancels while retaining the underlying drawer; focus returns to the triggering control. Canonical data operations, validation, confirmation requirements and account revision checks are unchanged.

Files: packages/ui package stylesheet export; new styles/index.css and surfaces.css; shared Confirmation component/tests, measured Notice component and account navigation icon; App header/dialog Escape guard; ProjectStart; ProjectToolbar, AccountPanel and Dashboard confirmation integration; tests/e2e/ui-surfaces.spec.ts; product documentation and status records.

No project schema, persistence version, pricing formula, AI output contract or export contract changed. No migration, dependency or infrastructure was added. Shared styles apply to rebuilt web/desktop clients; existing native installers were not rebuilt. File chooser/system menus remain OS controlled.

Final validation is recorded in status/validation.md. Next recommendation: use the shared surface rules for future UI work instead of adding independent form/overlay spacing overrides.
