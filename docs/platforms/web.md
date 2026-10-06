# Web app

`apps/web` owns the React entry, Vite config and static public assets. It consumes `@planner/ui` and outputs `apps/web/dist`. Run root `npm run dev` or `npm run build`.

Hash routing and relative production assets support static hosting. Keep the browser origin stable to retain local IndexedDB projects; export JSON when transferring origins. No deployment is performed automatically.
