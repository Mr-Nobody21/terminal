# Project dashboard and UI spacing — 2026-10-09

Added a shared dashboard feature with local project cards, account snapshot cards, search, named/provider-aware blank project creation, mode choice, refresh/error states and safe project-opening paths. Added dashboard hash routing/navigation; retained workspace/settings deep links and first-use onboarding. New project dialogs now reuse the responsive choice-card component.

Changed shared App/useWorkspace, new dashboard/Chevron components, navigation icons, ProjectStart/ProjectToolbar, diagram visibility fitting, shared styles, API client and regression/browser tests. Added product docs and status/handoff records. A Chrome DevTools Protocol review captured DOM snapshots, computed spacing and layout metrics, plus desktop/dark/mobile screenshots. The available Chromium runtime was used; a separate Google Chrome DevTools connector was not available.

Spacing fixes include consistent header/card/drawer/field padding, responsive header rows, aligned SVG header chevrons, centered select indicators and consistent native disclosure arrows. Dashboard section styling avoids inherited panel borders. Project management has a dedicated home; advanced settings remain in the project drawer. Original editor workflow and manual exports remain supported.

Review found two related defects: bodyless logout requests were labeled JSON and rejected by the backend, and hidden canvas initialization could produce a tiny diagram. The API now sets JSON Content-Type only when a body exists. Diagram fitting waits for measurable canvas dimensions and remains independent of canonical coordinates.

Canonical project/drawing schemas and versions are unchanged: no migration required. Existing account-scoped persistence, validated imports, prices, AI output, exports and asset IDs retain their contracts. Account snapshot replacement still requires confirmation. No dependency or infrastructure was added; native installers were not rebuilt.

Validation results are recorded in status/validation.md after the final suite. Remaining distribution work: rebuild native installers if requested. Next recommended UX work: user feedback on dashboard grouping and project management actions.

Final validation: lint/typecheck/build, 173 shared unit tests, six backend unit tests, 36 browser scenarios, nine packaging checks and four deployment checks passed. Fifteen database integration tests skipped. Bodyless logout against running backend returned HTTP 200. Final select styling checked again with manual editing/export and responsive dashboard scenarios. Screenshots are in test-results/dashboard-{desktop,dark,mobile}.png and workspace-spacing.png. No known task-specific issue remains; existing signing/import-compatibility limitations remain documented separately.
