# Testing

Run from the repository root:

```bash
npm run lint
npm test -- --run
npm run build
npm run test:e2e
npm run test:packaging
```

`npm run check` runs this sequence. Unit tests are colocated in the shared packages; Vitest setup lives in `tests/integration/setup.ts`. Playwright scenarios live in `tests/e2e` and start the web workspace through the root command. Packaging tests cover all three platform configurations and shared installer tooling.

Run `npm run test:rust` for native command tests and `npm run test:desktop` for isolated native webview smoke tests. The native suite builds a separate smoke feature, starts two launches, checks reload persistence/fullscreen and verifies exports. Linux requires a display and window manager; CI uses Xvfb/Openbox through `tooling/scripts/testing/linux-native-smoke.sh`.

AI tests use mocked responses and require no credentials or paid requests. Generated reports and profiles are ignored or stored in temporary folders. See [validation status](../../status/validation.md) for actual completed checks.
