# Acceptance criteria

Use the phase gates in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). A user must be able to plan manually, edit canonical resources and boundaries, obtain traceable deterministic estimates, save/reload locally, and export editable artifacts.

Optional mocked AI flows must extract facts/questions, retain explicit assumptions, generate two validated variants for AWS/Azure/GCP and exclude credentials from persistence/exports. Failed AI requests leave projects unchanged.

Workspace restructuring additionally requires: all four app directories own their configuration; shared packages resolve through npm workspaces; web dev/build and native commands use the new paths; tests and CI reference the moved files; no migration, backend or duplicated UI is introduced.

Automated results and manual compatibility limits are recorded in [validation](../status/validation.md).
