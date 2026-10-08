# Development setup

From the repository root, use Node.js 22.20+ or 24 LTS and pnpm 12.10.1:

```bash
pnpm install --frozen-lockfile
npx playwright install chromium
pnpm run dev
```

If using this checkout's ignored local runtime, prepend `$PWD/.runtime/bin` to PATH. Set `PLAYWRIGHT_BROWSERS_PATH=$PWD/.runtime/browsers` when using its installed browsers.

The web server starts at `http://127.0.0.1:5173`. Root commands forward to the web workspace. `pnpm run build` checks all application TypeScript and creates `apps/web/dist`.

For native desktop development, see [required infrastructure](../../infra/REQUIRED_INFRA.md) and [desktop builds](../platforms/desktop-builds.md). `pnpm run desktop` selects this host's platform configuration. Windows/Linux packages require matching native hosts.
