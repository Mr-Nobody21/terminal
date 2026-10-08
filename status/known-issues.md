# Known issues and verification limits

Current backend change: desktop installers and native auth smoke integration are not rebuilt/verified. Google OAuth, S3, email verification, password-reset delivery and real enrolled MFA are deferred. Fixed-code OTP verification is development-only and blocks production startup. See the security review for residual risks. The UI now requires the Node/PostgreSQL service for login/assets; setup is documented in backend/README.md.

- Windows/Linux release builds and native smoke tests now pass. Interactive installed-package startup/save-dialog checks still require a manual desktop check.
- Representative editable Draw.io import and SVG import into Microsoft Visio still require manual verification in those applications.
- Installed native save-dialog interaction remains a manual check; bridge/error behavior is covered automatically.
- The macOS package uses ad-hoc signing and is not notarized. No production signing credentials are configured.
- Pricing coverage is intentionally bounded; missing inputs/rates remain explicitly unpriced.
- PDF's standard font substitutes unsupported characters with `?`; other text exports retain Unicode.
- Existing large ELK/report chunks and dependency annotation warnings remain nonfatal build warnings.
- A relocated Rust target cache can contain absolute permission metadata paths. This checkout's previous cache was preserved under ignored `.runtime/tauri-target-before-workspace-move`; native artifacts are rebuilt at `packages/desktop/target`.

The earlier codebase move preserved contracts. Current canonical formats are project 3 and drawing 2; versioned migrations are documented. Backend ownership metadata introduces no new canonical version, and account-scoped local caches preserve legacy databases.
