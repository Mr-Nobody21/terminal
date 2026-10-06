# Contributing

Read root AGENTS.md and the linked architecture guidance first. Use the owning platform folder for platform packaging, shared UI for common interface behavior, domain for pure model/pricing/layout behavior, and adapters for storage, AI and native/browser integration.

Keep TypeScript strict. Canonical JSON is authoritative; edits must validate before history/storage. Credentials remain memory-only. Add tests for behavior changes and run the relevant checks in [testing](testing.md).

Persisted contract changes require migration reasoning, schema/round-trip tests and review of diagram, pricing, AI, storage and export impact. Pricing changes require formula, units, assumptions and deterministic fixtures. Do not add a backend or publish/deploy without authorization.

Update `status/STATUS.md`, validation and known issues when handing off work. Record future scope under `planning`, and infrastructure requirements under `infra`. Never commit secrets, build products or local runtimes.
