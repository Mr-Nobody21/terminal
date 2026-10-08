# Local development infrastructure

Install Node/pnpm and the locked workspaces with `pnpm install --frozen-lockfile`. Web development and unit tests need no Rust or cloud credentials. Projects persist in browser-origin IndexedDB.

Desktop development additionally needs the host's Rust/Tauri prerequisites. The build wrapper selects `.runtime/cargo` and `.runtime/rustup` if present; those directories are ignored and optional. It sets the shared shell and frontend roots explicitly, so commands work from the root or a platform workspace.

See [setup](../docs/development/setup.md). No local application server other than Vite's development server is introduced.


## Backend and database

Current source requires PostgreSQL 17 and the separate backend workspace. Follow [backend setup](../backend/README.md) before opening the web UI. `pnpm run dev:backend` starts the API; `pnpm run dev` starts the UI proxy. `pnpm run test:backend:integration` checks a real database using isolated temporary schemas. Credentials live only in ignored `backend/.env`.
