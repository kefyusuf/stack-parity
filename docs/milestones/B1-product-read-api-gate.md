# B1 Definition Gate — First Product Read API Slice

- **Status:** PROPOSED / REVIEW REQUIRED — **implementation not authorized**
- **Tracker:** [Issue #4](https://github.com/kefyusuf/stack-parity/issues/4)
- **Prerequisite:** B0 / SPIKE-001 `PASS` (8/8); [PR #3 merged](https://github.com/kefyusuf/stack-parity/pull/3), [Issue #1 closed](https://github.com/kefyusuf/stack-parity/issues/1) on 2026-10-13
- **Change type:** Planning and acceptance boundary only; **no runtime changes in this PR**

## Product purpose

Demonstrate **one database-backed, contract-typed read path** end to end:

```text
Prisma Postgres -> Hono GET /products -> HTTP JSON consumer
                        |
                        +-- imports @stack-parity/contracts (read shape)
```

This is the first narrow business-domain slice of the existing single product, **not** a catalog platform. Keep the already verified `GET /health` unchanged. Reuse the one existing `services/public-api` deployable and `packages/contracts`; do not start a second service.

## Proposed minimal observable contract

- Endpoint: `GET /products`, HTTP 200, JSON object with a `products` array.
- Candidate read item: `{ id: string, name: string }`. Additional attributes, including money/pricing and pagination, are **not** included in the current proof objective.
- Candidate response: `{ "products": [{ "id": "p-001", "name": "Sample Product" }] }`, backed by a deterministic seeded row in Postgres.
- Empty dataset: HTTP 200 with `{ "products": [] }`.
- A shared export in `@stack-parity/contracts` defines the HTTP read shape; Hono imports it by package boundary. No cross-framework handler, DB connection or repository implementation belongs in the contracts package.
- The fixture is **test data**, not a hard-coded HTTP response. Database read failures must not silently return the fixture or an empty success response.

The exact field names and fixture are **proposed**, not frozen until the B1 definition gate is reviewed.

## Evidence-gated sequencing

### Gate B1-D — Design, compatibility and resource decision (NOW; docs only)

1. Confirm the smallest Product read contract and deterministic seed fixture.
2. Verify the **official, version-matched** Prisma Postgres and ORM/client integration path with the committed Prisma CLI `8.0.0-rc.22` and Composer `0.29.1`. Record supported APIs, local DB/test mechanism and any actual incompatibility; do **not** assume old Prisma examples apply.
3. Establish how the local test will prove data really came from persistence (not Hono in-memory fixture); define how DB credentials are kept out of Git.
4. Record the explicit non-production stage, expected resource usage/budget and teardown/retention owner. The still-live `spike-001` stage is **not** auto-deleted or repurposed.
5. Review and approve the B1 implementation acceptance criteria **before** opening a code PR or provisioning/deploying new cloud resources.

If any dependency cannot be verified, classify it `BLOCKED` with evidence; do not add technologies to bypass the gate.

### Gate B1-I — Implementation (NEXT; NOT YET AUTHORIZED)

Only after B1-D approval, in a separate scoped issue/PR and with one incremental testable change at a time:

1. Introduce the smallest real Postgres Product table, repeatable local database setup/seed, and version-supported persistence client.
2. Export the shared contract and implement `GET /products` in the existing Hono public API.
3. Verify tests/typecheck/uncached build and real database-backed HTTP behavior locally.
4. Request **separate explicit cloud deployment approval** before publishing an isolated non-production Compute stage; capture external `GET /products` evidence, if approved.

## Candidate B1 implementation acceptance criteria (not yet executed)

- **B1-AC-01:** Clean frozen pnpm install and dependency/version compatibility documented.
- **B1-AC-02:** Hono uses the exported shared Product read contract, no source-relative cross-package import.
- **B1-AC-03:** A reproducible local seed persists at least one Product row in the selected Postgres database; a real read reflects database state.
- **B1-AC-04:** `GET /products` returns the documented 200 JSON array shape with seeded Product; empty table returns `[]`; missing/unavailable DB does not return HTTP 200 with fabricated data.
- **B1-AC-05:** Typecheck, tests and **uncached** build pass; `GET /health` still returns its previously verified response.
- **B1-AC-06:** After explicit approval, a real isolated non-production Compute deploy succeeds and external `GET /products` returns database-backed JSON; without approval, mark **PENDING**, not PASS.
- **B1-AC-07:** Exact versions, commands, output, stage URL, secret redaction, warnings and limitations are recorded.

## Strict exclusions

No write endpoints or full CRUD, Customer/Order, search/filter/sort/pagination, pricing logic, storefront/admin/marketing apps, NestJS, auth, SDK codegen, generic DDD/repository abstractions, multiple databases or services, alternative providers, queues, Redis, advanced CI/CD or production deployment.

## Preliminary version-matched source review (2026-10-13)

This is **static source/documentation evidence, not a tested database integration**:

- [Current official Composer database guide](https://www.prisma.io/docs/composer/databases) documents two distinct paths: `rawPostgres()` (caller manages a SQL client/migrations) and `postgres()` (Prisma ORM data contract, typed client and managed migrations). This project's original [bootstrap brief](../bootstrap-brief-v0.1.md) **plans Prisma Postgres + ORM**, so switching to a raw-client design requires an explicit design decision, not an incidental shortcut.
- The upstream [Composer v0.29.1 ORM example](https://github.com/prisma/composer/tree/v0.29.1/examples/orm-demo) actually exists at the **same Composer tag** pinned in StackParity. It demonstrates a single Compute service plus one typed Postgres resource: [module wiring](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/module.ts), [service dependency](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/service.ts), [data contract](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/contract.ts), [CLI/ORM configuration](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/prisma.config.ts) and [runtime read](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/server.ts).
- **Compatibility gap remains:** the tagged example uses `@prisma/orm-postgres@8.0.0-rc.17`, whereas this project's committed `prisma` CLI is `8.0.0-rc.22`. Do not copy dependency versions or assume that the generated ORM contract and migration workflow run correctly until a minimal **local** pinned-version validation succeeds.
- Local `prisma dev module.ts` can provision a local Postgres under the current [Composer guide](https://www.prisma.io/docs/composer/databases#local-databases), but StackParity has **not** executed that DB gate. Do not mark D-B1-01 resolved or provision a cloud database from these references alone.

## Decisions still open

- **D-B1-01:** Pin the concrete version-compatible Prisma Postgres provisioning and ORM/client path based on official docs and a minimal reproducible check.
- **D-B1-02:** Approve the candidate `id/name` contract and fixture or refine it strictly for read-path proof.
- **D-B1-03:** Choose and explicitly approve local + cloud test resource handling and cost/teardown policy.

**Exit from B1-D:** reviewer-approved acceptance scope, resolved D-B1-01..03, and a separate explicitly authorized implementation task. Opening this planning document alone is not approval.
