# Export implementation and compatibility gate

Exports validate the version 3 canonical project (with validated version 1/2 migration) before deriving artifacts. All diagrams use the same deterministic ELK projection, including saved user positions. Draw.io XML contains individual vertices, labels, connectors and boundary containers. Boundary children use parent-relative geometry. SVG contains vector rectangles, labels and connectors; PNG rasterizes that SVG in the browser. Markdown and DOCX include every architecture variant. PDF contains the active diagram plus the report. ZIP contains JSON, Draw.io, SVG, Markdown, DOCX and PDF, plus PNG when browser canvas is available. A README explicitly records PNG omission in runtimes without canvas. PNG rasterization errors fail the bundle rather than silently omitting the image.

XML text and attribute values are escaped. Imported files are validated by the project repository before mutation. Export never includes AI preferences or memory-only credentials. No external image fetching occurs while serializing artifacts.

Automated checks parse XML and SVG, verify groups and connectors, check report requirements/assumptions/cost warnings, round-trip JSON and inspect ZIP/DOCX/PDF structure.

Manual compatibility gate remains pending: open a representative `.drawio` file in diagrams.net, move an individual resource, edit a label and connector and inspect nested groups. Import SVG into Microsoft Visio and inspect text/shapes. These applications are not available in this environment, so no claim of verified native importer compatibility is made. Native VSDX is deferred.

PDF currently uses the bundled standard Helvetica font and replaces unsupported characters with `?`; Unicode content remains intact in JSON, SVG, Draw.io, Markdown and DOCX.

Runtime SVGs now come from the database-backed catalog cache loaded before the workspace renders. Export serialization uses that cache and remains self-contained. See backend/README.md for asset source seeds, attribution and startup requirements.
