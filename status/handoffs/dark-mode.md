# Dark mode — 2026-10-09

Changed shared theme provider/control and unit tests, App/AuthGate integration, application color tokens, architecture boundary presentation, browser tests, product feature documentation and status records.

Decisions: default to OS appearance; offer explicit Light/Dark overrides; save preference locally and synchronize tabs; tolerate unavailable storage; apply the theme before paint; use CSS variables across existing surfaces and React Flow. Sequence SVG styling is confined to the editor, preserving exported palettes. No canonical model, pricing, auth or database changes.

Validation: pnpm lint and strict typecheck passed; 121 shared unit tests and 6 backend unit tests passed; web/backend builds passed; 29 browser scenarios passed; 9 packaging and 4 deployment checks passed. Browser tests cover OS changes, explicit preferences, persistence and workspace surfaces. Manually inspected the dark login screen in the local preview. The local backend was restarted after dependency migration so preview requests connect again.

Known issues: existing nonfatal upstream Zod annotations and bundle-size warnings remain. Native installers and portable deployment artifacts from the preceding task were not regenerated for this UI change. Next: rebuild native/release artifacts when requested.
