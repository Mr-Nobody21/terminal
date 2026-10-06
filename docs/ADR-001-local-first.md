# ADR 001: Local-first MVP

Reconstructed guidance from IMPLEMENTATION_PLAN.md; original guidance was absent.

The application is a static browser application. IndexedDB stores validated projects. There is no backend, authentication, cloud storage, or proxy. AI calls occur directly from the browser on explicit submission; credentials stay in memory. JSON exports provide portable recovery. Save failures must preserve the in-memory project.
