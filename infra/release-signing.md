# Release signing

The current macOS profile uses ad-hoc signing (`signingIdentity: "-"`) and is not notarized. Windows installers are not configured with a production signing certificate. Linux packages have no new signing credentials.

For requested external distribution, document the intended signing/notarization process and provide credentials through the approved local/CI secret mechanism. Keep secrets outside source, app manifests, project JSON and exported bundles.

Signing/publishing remains a separate authorized delivery step. This folder contains documentation, not provisioned services or stored credentials.
