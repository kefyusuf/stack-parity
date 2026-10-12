# StackParity Bootstrap Brief v0.1

**Status:** B0 FROZEN · **Active ticket:** #1 · **Purpose:** establish scope and a narrow deployment feasibility gate.

## Project thesis

**One product. Many stacks. One contract.**

The final product is a realistic reference architecture, not a loosely related collection of Todo demos, nor a benchmark-only repository.

## Product direction (not B0 implementation scope)

A small commerce workflow gives each stack a natural role:

| Surface | Planned technology | Purpose |
|---|---|---|
| Marketing and documentation | Astro | Content-focused site |
| Customer storefront | Next.js | Product and order experience |
| Merchant dashboard | Nuxt | Merchant-facing workflows |
| Public API | Hono | Lightweight serverless HTTP boundary |
| Core API | NestJS | Business workflows / DI comparison |

Planned domain vocabulary: Product, Customer and Order.

The initial deployment platform is Prisma Compute; Prisma Postgres is planned for application persistence in a **later milestone**. Individual framework roles are accepted as **design intent** only, not proven Compute compatibility or permission to scaffold.

## Decisions

| ID | Decision | Status |
|---|---|---|
| D-001 | Repository: `kefyusuf/stack-parity`, public | Confirmed |
| D-002 | Name/tagline: StackParity — One product. Many stacks. One contract. | Frozen |
| D-003 | MIT license | Frozen |
| D-004 | pnpm workspace + Turborepo + TypeScript | Chosen for SPIKE-001; feasibility pending |
| D-005 | Prisma Compute as initial deployment target | Frozen for V0.1 |
| D-006 | Prisma Postgres + ORM for a later domain vertical slice | Planned, not active |
| D-007 | Product / Customer / Order as later domain model | Planned, not active |
| D-008 | Astro / Next / Nuxt / Nest as later product surfaces | Planned, not active |
| D-009 | Shared contracts, not shared framework implementations | Frozen |
| D-010 | Milestones advance only on verified acceptance evidence | Frozen |

## B0 in scope

- one pnpm/Turborepo workspace;
- one contracts package exporting a small observable value/type;
- one Hono public API service;
- `GET /health`;
- local build/typecheck/run;
- one Prisma Composer/Compute declaration;
- one remote deployment and HTTP verification;
- captured environment versions, commands, outputs, limitations.

## B0 expressly out of scope

Product/Customer/Order persistence, Prisma database provisioning, Next.js, Nuxt, Astro, NestJS, authentication, OpenAPI generation, queues, Redis, MCP, AI, previews, benchmarks, alternate cloud providers and extended CI.

## Completion gate

**PASS** requires a successful clean install, workspace import, local build/run and live Prisma Compute `GET /health` returning HTTP 200 with the version exported by the workspace contract.

**BLOCKED** means external credentials/runtime prevent a real deploy; it is *not* a PASS.

**FAIL** requires documented, reproducible incompatibility. A narrow build-packaging adjustment is allowed; adding unrelated technologies to work around the failure is not.

Only after the gate closes may the team start the first Product API vertical slice.
