# Known issues and verification limits

- Windows/Linux release builds and native smoke tests now pass. Interactive installed-package startup/save-dialog checks still require a manual desktop check.
- Representative editable Draw.io import and SVG import into Microsoft Visio still require manual verification in those applications.
- Installed native save-dialog interaction remains a manual check; bridge/error behavior is covered automatically.
- The macOS package uses ad-hoc signing and is not notarized. No production signing credentials are configured.
- Pricing coverage is intentionally bounded; missing inputs/rates remain explicitly unpriced.
- PDF's standard font substitutes unsupported characters with `?`; other text exports retain Unicode.
- Existing large ELK/report chunks and dependency annotation warnings remain nonfatal build warnings.
- A relocated Rust target cache can contain absolute permission metadata paths. This checkout's previous cache was preserved under ignored `.runtime/tauri-target-before-workspace-move`; native artifacts are rebuilt at `packages/desktop/target`.

The codebase move preserves the canonical project format and browser storage database. No project migration is needed.
