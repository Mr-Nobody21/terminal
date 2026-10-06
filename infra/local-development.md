# Local development infrastructure

Install Node/npm and the locked workspaces with `npm ci`. Web development and unit tests need no Rust or cloud credentials. Projects persist in browser-origin IndexedDB.

Desktop development additionally needs the host's Rust/Tauri prerequisites. The build wrapper selects `.runtime/cargo` and `.runtime/rustup` if present; those directories are ignored and optional. It sets the shared shell and frontend roots explicitly, so commands work from the root or a platform workspace.

See [setup](../docs/development/setup.md). No local application server other than Vite's development server is introduced.
