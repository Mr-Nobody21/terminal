# Third-party assets — 2026-10-09

Added 64 visual tools and their searchable aliases to a Third-party tools library: databases, messaging, CI/CD, source control, automation, networking, observability, identity, hosting and data/AI. Assets are available in the shared web/desktop UI; native installers need rebuilding to include source changes.

Changed domain drawing asset registry, new tools catalog, shared search indexing/tests, drawing palette copy, backend SVG assets/manifest, drawing round-trip test, browser acceptance scenario, attribution and product docs. Original text badges avoid adding third-party icon dependencies. Seeded local PostgreSQL using the existing backend asset pipeline and verified the running catalog exposes all 64 badges.

No drawing schema or format version changed: asset IDs remain strings validated against the registry. Existing IDs and imports are retained. New tools require a reader with the updated registry. Diagram projections, storage and exports retain tool IDs and use the existing asset path; pricing and cloud AI structured resources are unaffected. Visual tools have no cost estimate.

Validation: lint, strict typecheck, 172 shared unit tests and web/backend build passed. Browser acceptance covers names/CI keyword discovery, SVG loading, tool insertion, JSON export and reload persistence. See status/validation.md for the final browser result.

Next: collect requests for additional tools; optionally replace original badges with appropriately attributed official vendor artwork.
