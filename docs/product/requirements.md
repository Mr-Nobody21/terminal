# Product requirements

The authoritative phased requirements and deferred scope are in [the implementation plan](../../planning/IMPLEMENTATION_PLAN.md). Architecture is local-first, provider-native, editable and deterministically priced.

Manual planning must work without credentials. Optional AI interprets requirements and proposes canonical JSON; it never calculates prices, coordinates or Draw.io XML. Project data stays in IndexedDB and portable exports; credentials stay in memory.

See [AI](ai.md), [pricing](pricing.md), [exports](exports.md) and [acceptance criteria](../../planning/acceptance-criteria.md).
