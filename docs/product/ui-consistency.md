# Popup, menu and form consistency

The shared UI stylesheet entry imports the workspace layout followed by `packages/ui/src/styles/surfaces.css`. That file owns popup geometry and the 8/12/16/24px spacing scale. Drawer padding is 24px on desktop and 20px on narrow screens; compact inspectors and menus use 16–20px. Form controls and action buttons have a 40px minimum height, with 32px icon/close controls. Inputs have explicit label gaps, and export controls use evenly spaced grids.

Popups use opaque theme surfaces, consistent borders/radii, contained scrolling and viewport width limits. Expanded connection and advanced-tool menus appear above inspectors. Mobile inspectors leave space for collapsed connection controls. Notifications reserve a measured band below the header instead of covering panel controls; persistent drawing-save warnings use the same layout. The mobile header keeps logout, account, appearance, fullscreen and export reachable; cost details remain available through Costs navigation. Dropdown indicators and disclosure controls retain the shared chevron styling.

Project/account confirmations use one accessible dialog rather than browser-native confirmation prompts. The dialog labels its title and description, initially focuses Cancel, traps focus using native modal behavior and restores focus afterward. Escape cancels without closing the underlying project panel. Destructive actions proceed only after the explicitly labeled confirmation button. Existing confirmation wording and data operations remain intact.

## DevTools review coverage

`tests/e2e/ui-surfaces.spec.ts` uses Chromium's Chrome DevTools Protocol (`Page.getLayoutMetrics` and `DOMSnapshot.captureSnapshot`) and user interactions to inspect these surfaces in desktop, 390px mobile and dark mode:

| Surface | Reviewed states |
| --- | --- |
| Project creation | Onboarding, dashboard name/provider/mode, project drawer, example creation, cancellation |
| Account and project settings | Device/account controls, account list, delete prompts, snapshot replacement, legacy import prompt |
| Requirements and pricing | Input/assumption spacing, AI controls, every cost disclosure, warning/source sections |
| Architecture editor | Provider search, advanced tools, boundary/service/connection inspectors, workload disclosures, connection menu |
| Drawing editors | Flowchart, sequence, ER and infrastructure palettes, nodes, connection menus and connector inspectors; ER cardinality and sequence reply controls |
| Assets and images | Third-party assets, image properties and sizing controls |
| AI settings | Every available provider option and corresponding fields |
| Export/import | Architecture and each drawing type, editable/raster formats and file input |
| Authentication | Sign-in, registration validation and verification-code fields |

Layout assertions reject horizontally clipped header controls and overflowing popup surfaces. Browser tests also check Escape/cancel, keyboard select operation and confirmed deletion. Unit tests cover confirmation results and focus restoration. Screenshots and JSON DevTools attachments are generated under `test-results` (ignored generated output).

The file chooser is invoked but remains an OS/browser-controlled surface; application CSS styles its input trigger, not the native chooser window. Native installer system menus are likewise outside the shared web stylesheet. No live account deletion or external write is required by the review: acceptance runs use mocked API responses and isolated browser storage.
