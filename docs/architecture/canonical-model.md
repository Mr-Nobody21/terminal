# Canonical model

Reconstructed guidance from IMPLEMENTATION_PLAN.md.

Version 1 is the initial persisted format. Reject future versions; introduce explicit migrations when changing persisted contracts. Stable UUIDs identify all entities. Architecture resources, connections, and nested boundaries are authoritative; diagram positions are optional presentation metadata. AI proposals cannot provide positions. Inputs reference facts, assumptions, or catalog constants. Validate references before storage, pricing, rendering, and export. Duplication remaps every identifier and reference.

Contract impact review: diagram projects resources and boundaries; pricing reads configuration and input provenance; AI validates proposals against the same architecture schema; storage saves validated snapshots; exports derive from validated snapshots. Initial version has no historical migrations. Round-trip and rejection tests are required.
