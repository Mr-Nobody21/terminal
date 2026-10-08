# Project modes and file exchange

On first launch, **New project**, and **New example**, choose **Plan with costs** or **Simple diagram**. Cost mode opens the cloud architecture editor and monthly estimate panel. Simple mode opens the infrastructure drawing editor and hides cost totals, Costs and Requirements navigation, and the cloud architecture option. The project retains its choice after reload and switching projects. Change it with **Cost calculations** in Projects. Both the architecture and independent drawings are retained when switching modes. Duplication retains the mode; imported projects use their saved mode.

Existing version 1/2 projects migrate to version 3 with costs enabled, preserving prior behavior and IDs. A new blank project has no resources or requirements. Examples remain available separately. Canceling project creation leaves the active project intact.

## Formats

Open **Export** for the active architecture or drawing. The file import control accepts:

| Format | Import | Export |
| --- | --- | --- |
| Mermaid `.mmd`, `.mermaid` | Planner files retain their validated canonical data. Plain supported flowcharts, sequences and ER diagrams become editable drawings. | Architecture/infrastructure/flowcharts produce flowchart syntax, sequences produce sequence syntax, ER diagrams produce ER syntax. Planner metadata preserves configurations, fields, IDs and image references. |
| XML `.xml`, `.drawio` | Planner XML retains canonical data. External uncompressed Draw.io XML becomes an editable flowchart, with nested offsets flattened. | Editable Draw.io XML vertices and connectors with embedded planner metadata. Existing Draw.io export remains available separately. |
| Excel `.xlsx` | Workbooks exported here; reimport edits from the Diagram sheet after validation. | Genuine OOXML workbook with Diagram table, Planner data, and Overview. Cost-enabled projects include known resource subtotals, completeness, warnings and pricing source URLs. |
| PNG `.png` | Movable reference image in flowchart/infrastructure drawings. Importing while in cloud, sequence or ER mode opens the infrastructure drawing. | Active diagram rasterized locally from SVG. |
| JPEG `.jpg`, `.jpeg` | Same reference-image behavior. | JPEG raster diagram with a white background. |

Excel project rows expose ID, Label, Provider, Region, Service, Environment and SKU. Drawing rows expose ID and Label. Edit labels or project configuration columns, then import to validate and recalculate in the app. Keep IDs, row count, column order, sheet order and Planner data unchanged. Overview totals are snapshots; Excel does not run the cloud calculators. Workbooks use literal strings and do not execute formula cells. Unsupported formulas, missing rows, bad IDs and invalid configurations fail before changes are applied. Legacy binary `.xls` files and unrelated Excel workbooks are not supported.

Plain Mermaid supports standalone nodes, `-->` connections and labels in LR/RL/TB/TD/BT flowcharts; `participant`, `->>` and `-->>` sequence messages; and ER entity blocks with cardinality relationships. Unsupported syntax produces a recoverable error, including subgraphs, styling directives, activation bars and sequence fragments. External layout direction is accepted but the canvas uses its own layout/positions. Raster references have no native Mermaid image representation; the planner metadata retains them.

Planner XML/Mermaid metadata is restored only when its visible diagram text matches the export fingerprint. If another editor changes visible syntax, import parses the visible diagram into a generic drawing rather than restoring stale cloud configuration. External Draw.io imports flatten groups and retain basic labels/positions/connectors; custom shapes, embedded images, floating connectors and compressed diagrams are not generally converted. Use canonical JSON for the authoritative architecture backup. Browser tests verify app round-trips; manual testing in Draw.io, Excel and Mermaid consumers remains outstanding.

Images retain local base64 PNG/JPEG bytes and editable position/size; they do not create resources, extract topology, OCR text, or infer costs. Select an image to change its label/width or delete it. Individual images are limited to 5 MB and 32 megapixels; total encoded images in one drawing are limited to 7 MB. File imports are limited to 10 MB. Image output is limited to 32 megapixels. All processing stays local; no upload, backend, paid service or new runtime dependency is required.

Drawing JSON/Excel/XML/Mermaid exports back up reference images. Cloud project JSON and the existing cloud ZIP do not include separate drawings. New formats are available individually; the existing ZIP contents remain documented in the exports guide.

Implementation references: [Mermaid ER syntax and aliases](https://mermaid.js.org/syntax/entityRelationshipDiagram.html), [Mermaid sequence syntax](https://mermaid.js.org/syntax/sequenceDiagram.html), and [Microsoft SpreadsheetML package structure](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document). The app intentionally supports a documented subset of the diagram syntaxes.
