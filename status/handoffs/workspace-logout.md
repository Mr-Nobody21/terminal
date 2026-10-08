# Workspace logout — 2026-10-09

Added a visible Log out control to the shared workspace header in packages/ui/src/app/App.tsx. Pending drawing and project saves flush before the existing POST logout flow clears session UI/history. Busy state prevents repeated header submissions. Failure leaves the workspace active, displays the error and enables retry. Existing Projects-panel sign out remains available. No backend, schema, pricing, storage or export contract changes; no migration required.

Added a browser test in tests/e2e/auth.spec.ts covering POST logout, recoverable failure, retry, return to sign-in and refresh after logout. Product feature documentation updated. Native installers need rebuilding to receive this shared UI change.

Validation passed: lint, strict typecheck/build, 172 shared unit tests, six backend tests, 34 browser scenarios and nine packaging checks. Database integration tests were skipped. No known logout-specific issue remains.
