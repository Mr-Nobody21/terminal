# Catalog search and project dialog — 2026-10-09

Implemented responsive project-start choice cards and direct cross-provider search in architecture and drawing palettes. Removed provider-filter dropdowns; provider groups expose related services and assets. Local indexed aliases cover generic compute/container/database/storage/network/search terminology, including ECS alternatives and Elasticsearch/OpenSearch. Provider-qualified selection and drag identifiers preserve mixed-cloud resource creation. Repeated display entries are deduplicated.

Changed shared domain search module/tests and package export, UI architecture/drawing/project components and styles, application wiring, browser scenarios, product documentation and status. Canonical schemas, pricing and persistence formats are unchanged; no migration is required. Search adds no dependency or infrastructure. Elasticsearch means searchable service/keyword support in this implementation, not an Elasticsearch engine; clarification remains optional.

Validation: lint, strict TypeScript, 169 shared unit tests, 32 browser scenarios, web/backend build, nine packaging checks and four deployment-script checks passed. Backend unit suite passed six tests; database integration tests were skipped in this run. Browser checks cover provider-qualified additions, persistence, asset libraries, generic queries, dialog layout and dark/mobile appearance. Existing native installers were not rebuilt.

Related services are discovery suggestions rather than guaranteed interchangeable products. Next recommended work: review alias coverage against real user searches and rebuild native installers when distribution is requested.
