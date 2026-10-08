# Project dashboard and workspace navigation

Open **Dashboard** in the left navigation or click the app mark to view projects. Visiting the app root with saved projects opens the dashboard; `#workspace` and `#settings` retain their direct routes. First-time users retain the cost-mode onboarding choice.

The dashboard has two clearly labeled sections:

- **On this device** lists the signed-in account's local project saves, including cost mode, cloud provider, last edit date and current-project status.
- **Saved to your account** lists server snapshots, with revision and explicit refresh. An account connection failure leaves device projects available and offers refresh/retry.

Search filters both sections by name. **New project** asks for a name, provider and cost mode, then opens a blank architecture or infrastructure diagram. Opening an existing project flushes pending architecture/drawing edits first. Account snapshots are validated before use; replacing an existing device copy requires confirmation. New resources, pricing formulas and project schema versions are unaffected.

Project settings remain available through the project-name/account controls and Projects navigation. **View all projects** returns to the dashboard. Advanced account save/import/delete and project rename/duplicate/import controls stay in project settings rather than the canvas. Account saves remain explicit; the dashboard does not automatically upload local edits.

Shared spacing provides 24px card/drawer padding, consistent field gaps, responsive headers and provider groups. SVG chevrons replace text arrows in header controls; selects and native disclosures have consistent, centered indicators. Desktop, narrow-screen and dark appearance use the same UI. Returning to a visible architecture canvas waits for measurable dimensions before fitting nodes, avoiding a tiny diagram initialized in a hidden panel.

The UI review also fixed bodyless API calls: logout no longer sends a JSON Content-Type header without a body. Credentials, request-origin protection and session cookies remain unchanged.
