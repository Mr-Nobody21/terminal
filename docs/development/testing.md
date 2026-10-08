# Testing

Run from the repository root:

```bash
pnpm run lint
pnpm test --run
pnpm run test:backend
pnpm run test:backend:integration # real PostgreSQL required
pnpm run build
pnpm run test:e2e
pnpm run test:packaging
```

`pnpm run check` runs lint, shared/backend unit tests, builds, browser and packaging checks. The real PostgreSQL integration command is a separate required gate for backend changes; it uses isolated random schemas and fails if no database URL is configured. Unit tests are colocated in the shared packages; Vitest setup lives in `tests/integration/setup.ts`. Playwright scenarios live in `tests/e2e` and start the web workspace through the root command. Packaging tests cover all three platform configurations and shared installer tooling.

Run `pnpm run test:rust` for native command tests and `pnpm run test:desktop` for isolated native webview smoke tests. The native suite builds a separate smoke feature, starts two launches, checks reload persistence/fullscreen and verifies exports. Linux requires a display and window manager; CI uses Xvfb/Openbox through `tooling/scripts/testing/linux-native-smoke.sh`.

AI tests use mocked responses and require no credentials or paid requests. Generated reports and profiles are ignored or stored in temporary folders. See [validation status](../../status/validation.md) for actual completed checks.

Current desktop installers/native smoke automation predate backend authentication. Native auth integration requires configured backend origins/cookies and an authenticated test fixture; it was not run for this backend change. See the backend handoff for actual current validation.
