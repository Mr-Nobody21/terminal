# Development setup

From the repository root, use Node.js 22.12+ and npm:

```bash
npm ci
npx playwright install chromium
npm run dev
```

If using this checkout's ignored local runtime, prepend `$PWD/.runtime/bin` to PATH. Set `PLAYWRIGHT_BROWSERS_PATH=$PWD/.runtime/browsers` when using its installed browsers.

The web server starts at `http://127.0.0.1:5173`. Root commands forward to the web workspace. `npm run build` checks all application TypeScript and creates `apps/web/dist`.

For native desktop development, see [required infrastructure](../../infra/REQUIRED_INFRA.md) and [desktop builds](../platforms/desktop-builds.md). `npm run desktop` selects this host's platform configuration. Windows/Linux packages require matching native hosts.
