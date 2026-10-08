# Bundled architecture icons

Retrieved 2026-10-06. SVGs retain official appearance. `backend/assets/icons/manifest.json` identifies the exact archive path used for each service. Azure Blob Storage uses the official Storage Accounts icon; Container Apps uses Worker Container App. AWS ALB uses Elastic Load Balancing. Google uses the official legacy console set, retained for complete service coverage. Names are displayed next to icons. Generic unsupported fallback is original project artwork.

- AWS © Amazon Web Services: [architecture icons and permitted diagram use](https://aws.amazon.com/architecture/icons/). July 2026 official Icon-package_07312026 archive. AWS permits customers and partners to use these assets to create architecture diagrams; marks remain AWS property.
- Azure © Microsoft Corporation: [official collection and terms](https://learn.microsoft.com/en-us/azure/architecture/icons/). Azure_Public_Service_Icons_V24.zip. Microsoft permits copying, distributing and displaying icons in architecture diagrams, training and documentation; all other rights reserved. Do not crop, flip, rotate or distort icons.
- Google Cloud © Google: [official icon library](https://cloud.google.com/icons). Official google-cloud-legacy-icons.zip from services.google.com. Product marks remain Google's property; use for diagrams/documentation, without implying endorsement.

These are vendor marks and diagram assets, not project-owned illustrations. Downloads occur during development only; the backend seeds reviewed originals into PostgreSQL. The UI fetches these bytes from its configured backend; exports embed them without fetching vendor sites.

## Additional infrastructure diagram libraries

Retrieved 2026-10-08. Selected source paths, pinned IBM/Kubernetes commits and source URLs are recorded in `backend/assets/drawing-assets/manifest.json`. These libraries are visual assets; their presence does not imply cloud deployment or pricing support.

- Oracle © Oracle and/or its affiliates: [OCI Architecture Diagram Toolkit](https://docs.oracle.com/en-us/iaas/Content/General/Reference/graphicsfordiagrams.htm). Six service assets are converted from the toolkit's original draw.io vector stencils to equivalent SVG paths by `tooling/scripts/assets/import-drawing-icons.py`. The documentation provides these assets for custom OCI implementation diagrams. Oracle marks remain Oracle property; no endorsement is implied.
- IBM © IBM: [official IBM Cloud architecture icons](https://github.com/IBM-Cloud/architecture-icons). Six original SVGs are bundled unchanged from the official collection provided for external customers and business partners creating IBM Cloud diagrams. This is vendor artwork, not project-owned or relicensed artwork.
- Kubernetes: [community diagram icons](https://github.com/kubernetes/community/tree/main/icons). Six original SVGs are bundled unchanged; retain the upstream [Apache 2.0 license](https://github.com/kubernetes/community/blob/main/LICENSE) and notices. Kubernetes marks remain their respective owners' property.
- Generic infrastructure: six original project SVG symbols for server, database, user, internet, firewall and queue. No vendor affiliation.

The importer uses development-time downloads only. Runtime palettes use the database catalog cache; exports embed icon data.

## Third-party tools

The 64 tool badges in `backend/assets/drawing-assets/tools` are original project text artwork, not vendor logos. Product names identify diagram components; they do not imply affiliation. The manifest records source and SHA-256. These SVGs follow the same database seed, catalog-cache and embedded-export paths as other assets.
