# AGENTS.md — Cloud Architecture Planner MVP

## Mission

Build the MVP described in `IMPLEMENTATION_PLAN.md`.

The product is a browser-first, local-first cloud architecture planning tool that converts requirements into provider-native diagrams and deterministic cost estimates while keeping platform infrastructure cost effectively zero.

## Read First

Before implementation:
1. Read `IMPLEMENTATION_PLAN.md`.
2. Read `docs/ADR-001-local-first.md`.
3. Read `docs/CANONICAL_MODEL.md`.
4. Read `docs/PLUGIN_AND_SKILL_MATRIX.md`.
5. Load applicable project skills from `.codex/skills/`.

## Non-negotiable Engineering Rules

- Do not introduce a backend for MVP.
- Do not add auth, hosted DB, server-side storage, queues, or serverless APIs.
- Do not add a paid runtime dependency.
- Do not hardcode AI-generated coordinates into diagrams.
- Do not ask the LLM to perform cloud-cost arithmetic.
- Do not ask the LLM to generate Draw.io XML.
- Canonical architecture JSON is the single source of truth.
- Canvas state is a projection of the canonical model.
- Pricing inputs must be traceable to user facts or explicit assumptions.
- API keys must remain browser-local and must not be included in project exports.
- Keep provider-specific behavior behind registries/adapters.
- Prefer pure functions for domain validation, pricing, and export.
- Add tests with each behavior change.
- Keep TypeScript strict.
- Avoid `any` unless there is a documented boundary reason.
- Avoid speculative abstractions not needed by the MVP.

## Autonomy

For build/fix requests:
- inspect the repository,
- make in-scope local changes,
- run non-destructive validation,
- fix failures,
- continue until the requested phase is complete.

Stop for approval before:
- destructive filesystem operations,
- external writes,
- publishing/deploying,
- creating paid resources,
- adding a backend,
- materially expanding MVP scope.

## Validation

Before declaring a task complete, run the applicable checks:

```bash
npm run lint
npm test -- --run
npm run build
npm run test:e2e
```

If a command does not exist yet during early bootstrap, create the appropriate script before Phase 0 is complete.

## Architecture Change Rule

Any change to the canonical architecture schema must include:
- migration/backward compatibility reasoning,
- schema tests,
- project JSON round-trip test,
- impact review for diagram, pricing, AI structured output, storage, and export.

## Cost Change Rule

Every pricing formula change must include:
- formula,
- units,
- assumptions,
- at least one deterministic fixture test,
- no LLM involvement.

## Draw.io Rule

Draw.io export must preserve:
- editable service nodes,
- editable labels,
- editable connectors,
- group/boundary structure where supported.

A screenshot embedded in a Draw.io file does not count as implementation.

## Handoff Output

At the end of each phase, report:
- files changed,
- major decisions,
- tests run,
- remaining known issues,
- next phase recommendation.
