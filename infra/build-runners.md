# Build runners

Current profiles use macOS ARM64 for app/DMG, Windows x64 for NSIS EXE/MSI, and Linux x64 for AppImage/DEB. Run each packaging command on its matching host; the launcher rejects unsupported host/architecture combinations before compilation.

The prepared [desktop workflow](../.github/workflows/desktop-build.yml) uses Windows Server 2022 and Ubuntu 22.04. It installs Node/Rust and Linux WebKitGTK/build dependencies, runs automated checks/native smoke tests, then collects installers. Linux smoke tests use Xvfb/Openbox; AppImage packaging enables extraction/run mode. The workflow uploads run artifacts without publishing releases.

Windows requires Visual Studio C++ tooling, SDK/WebView2; MSI needs the VBScript optional feature. Linux dependencies are listed in the workflow. macOS needs Xcode command-line tools. [Desktop build guidance](../docs/platforms/desktop-builds.md) records verification status.

The subsequent user request to finish builds authorized the implementation-branch push and native runner execution. Both jobs passed in [the verified run](https://github.com/Mr-Nobody21/terminal/actions/runs/37518425062). No hosted application infrastructure, production deployment or release publishing was added.
