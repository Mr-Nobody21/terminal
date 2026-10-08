# Diagram types and asset libraries

Choose a diagram type at the upper left of the canvas. The selection changes the editor without replacing the existing cloud architecture.

| Type | Editing | Pricing | Exports |
|---|---|---|---|
| Cloud architecture | Provider services, boundaries, configuration and connections | Existing deterministic AWS/Azure/GCP estimate | Existing eight export formats |
| Flowchart | Process, decision, start/end and input/output shapes; labelled connections | None | JSON, SVG, editable Draw.io and [additional formats](project-modes-and-files.md) |
| Sequence diagram | Participants, ordered messages, dashed replies and message reordering | None | JSON, SVG, editable Draw.io and [additional formats](project-modes-and-files.md) |
| ER diagram | Entities, editable attributes, labelled relationships and 1:1 / 1:N / N:M cardinality | None | JSON, SVG, editable Draw.io and [additional formats](project-modes-and-files.md) |
| Infrastructure diagram | Mixed vendor and generic asset nodes with labelled connectors | None | JSON, SVG, editable Draw.io and [additional formats](project-modes-and-files.md) |

## Asset libraries

The Shapes palette exposes AWS, Azure, Google Cloud, Oracle Cloud, IBM Cloud, Kubernetes and generic infrastructure libraries. The five cloud libraries now include fetched official inventory entries alongside the configured service catalog. See [service inventories and coverage](service-inventories.md) for the complete offline lists and their source scope.

A cloud architecture can combine all five cloud providers. Choosing a library and clicking or dragging a service adds it to the current architecture, with that provider's default supported planning region. Cross-cloud connectors are editable like other connectors. Kubernetes and generic visual assets remain available in the independent infrastructure editor. Additional catalog entries use generic fallback icons and remain explicitly unpriced. Region validation is limited to the launch planning regions, not a guarantee that every catalog service is deployable there.

Icons are local and work without runtime asset fetching. See [sources and attribution](../../data/attribution/icons.md).

## Local documents and recovery

Each cloud project can have one working drawing per additional type. Drawings autosave independently in IndexedDB and return when you select that type again. Drawing history and deletion affect only that drawing; cloud architecture undo/redo remains separate. Project duplication copies associated drawings with new IDs; confirmed project deletion removes associated drawings.

Cloud project JSON is now version 3, with automatic validated migration from versions 1/2, and does not include these drawings. Export each drawing's JSON separately to back it up or transfer it. Import drawing JSON from the drawing export panel; unknown versions, invalid references and incompatible shapes are rejected. Importing replaces the working drawing of that type in the selected project. An ID collision with another project receives new IDs instead of overwriting the other project's data.

Save failures retain the in-memory drawing, show a recovery notice and block project switching until saving succeeds. Drawing JSON remains available for recovery. Sequence participants are laid out in insertion order; message order determines vertical position. Edit messages using the Participants & messages panel. This initial editor does not model activation bars, fragments, self messages, ER key constraints beyond attribute text, or crow's-foot notation. Cardinality is shown explicitly as text.

Only cloud architecture uses AI generation and cost estimates. New diagram types are manual; their export menu deliberately exposes only implemented formats. Existing Draw.io/Visio manual importer verification remains outstanding.

Reference images are supported in flowchart and infrastructure drawings. Drawing version 1 migrates to version 2 without changing IDs. See [project modes and file exchange](project-modes-and-files.md).
