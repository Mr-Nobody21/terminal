# Backend scope

Reserved for future backend work. The current MVP has no server, authentication, hosted database, application proxy, queues or cloud storage. Projects stay in IndexedDB and AI requests go directly to the chosen provider after submission.

There is no backend build or runtime to deploy. The Rust shell in `packages/desktop` provides local operating-system integration; it is not a hosted backend. Adding a backend requires an explicit architecture decision and authorization to expand the MVP.
