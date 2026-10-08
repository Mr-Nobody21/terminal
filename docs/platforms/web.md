# Web app

`apps/web` owns the React entry, Vite config and static public assets. It consumes `@planner/ui` and outputs `apps/web/dist`. Run root `pnpm run dev` or `pnpm run build`.

Hash routing and relative production assets support static hosting. Keep the browser origin stable to retain local IndexedDB projects; export JSON when transferring origins. No deployment is performed automatically.

## Build and preview

From the repository root:

```bash
pnpm run build:web
pnpm run preview:web --port 4173
```

Open `http://127.0.0.1:4173/`. The production web version includes the same manual editor as the desktop apps: searchable cloud shapes, drag-to-place services, contextual properties, connections, history and expandable navigation. Browser downloads replace native file dialogs; fullscreen uses the browser API.

For development, run `pnpm run dev`. No Rust toolchain or desktop installation is required for the web app. Serve the build over HTTP/HTTPS rather than opening `index.html` directly from the filesystem.

## Static distribution

The generated web distribution is `apps/web/dist/`. Upload its contents to a static host or serve that directory with a local static server. Relative assets and hash routing support subdirectory hosting. The ZIP at `release/web/Cloud-Architecture-Planner-web-0.1.0.zip`, when generated, contains these files at its root.

Projects stay in the current browser profile and origin. Changing domain or port creates a different local storage origin; use JSON export/import to transfer projects. AI remains optional and requires browser-accessible provider endpoints. This distribution does not add an offline/PWA shell or a backend.

## Backend requirement (2026-10-08)

The current UI now requires the [authenticated backend](../../backend/README.md) for login and runtime image assets. Previous standalone/static-only instructions describe the historical MVP. Vite dev and preview proxy `/api` to localhost port 3001. Production static UI hosting must route `/api` to the backend or set `VITE_BACKEND_URL` at build time. Prefer same-origin HTTPS cookies. SVG/Draw.io exports embed the fetched asset bytes and remain portable.
