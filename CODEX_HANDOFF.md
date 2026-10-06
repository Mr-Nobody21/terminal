# Codex Handoff — Start MVP Implementation

You are the primary implementation agent for the Cloud Architecture Planner MVP.

Read, in order:
1. `AGENTS.md`
2. `IMPLEMENTATION_PLAN.md`
3. `docs/ADR-001-local-first.md`
4. `docs/CANONICAL_MODEL.md`
5. `docs/PLUGIN_AND_SKILL_MATRIX.md`
6. all relevant `.codex/skills/*/SKILL.md`

## Objective

Start implementation now.

Complete **Phase 0** and then **Phase 1** from `IMPLEMENTATION_PLAN.md`.

If the repository was just scaffolded, first inspect the generated Vite files and simplify them.

## Phase 0 requirements

- clean Vite React TypeScript application
- strict TypeScript
- coherent `src/` feature/core directory structure
- ESLint
- Vitest + React Testing Library
- Playwright smoke test
- scripts:
  - `dev`
  - `build`
  - `lint`
  - `test`
  - `test:e2e`
  - `check`
- simple workspace shell with:
  - left requirements panel placeholder
  - central diagram canvas placeholder
  - right cost panel placeholder
- no backend

## Phase 1 requirements

Implement the canonical domain model using Zod.

Required:
- provider enum
- resource categories
- service IDs
- project schema
- resources
- connections
- assumptions
- architecture variants
- schema validation helpers
- stable resource ID helper
- project JSON serializer/deserializer
- validation result/error type
- unit tests
- round-trip tests

Seed one fixture project:
- AWS
- CloudFront
- ECS/Fargate
- RDS PostgreSQL
- S3
- connections
- explicit cost assumptions

## Constraints

Do not:
- add a backend,
- add authentication,
- add server APIs,
- implement AI yet,
- implement provider pricing yet,
- implement Draw.io export yet,
- add speculative abstractions.

Create clean extension points, but only implement Phase 0 + Phase 1.

## Validation

Run and fix until clean:

```bash
npm run check
```

If Playwright requires browser installation, document that clearly and make the regular unit/build checks pass first. Do not weaken tests to get green.

## Completion response

Return:
- concise summary,
- key files created,
- commands/tests run,
- any blocker,
- exact recommended next task for Phase 2.
