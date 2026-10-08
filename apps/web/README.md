# Web application

The platform entry mounts the shared React UI. Vite emits `dist` here. Runtime service icons are fetched from the database-backed backend; there are no public icon duplicates.

Start PostgreSQL and the API using [backend setup](../../backend/README.md), then run root `pnpm run dev`. Vite proxies `/api` to `127.0.0.1:3001`. Set `VITE_BACKEND_URL` at build time for another API origin. `pnpm run build:web` builds the UI and backend; `pnpm run preview:web --port 4173` serves the UI with the same local API proxy. The web version requires no Rust runtime, but now requires the backend for sign-in and assets.
