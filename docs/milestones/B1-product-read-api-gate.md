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
- Candidate response: `{ "products": [{ "id": "p-001", "name": "Sample Product" }] }`, backed by a deterministic seeded row in Postgres. The `id` is an opaque string; this does not prescribe UUID generation or business identifiers.
- Empty dataset: HTTP 200 with `{ "products": [] }`. For predictable repeated reads, specify an **internal** order by `id`; do not add a public sort/query interface.
- A shared export in `@stack-parity/contracts` defines the HTTP read shape; Hono imports it by package boundary. No cross-framework handler, DB connection or repository implementation belongs in the contracts package.
- The fixture is **test data**, not a hard-coded HTTP response. Database read failures must not silently return the fixture or an empty success response.

The exact field names and fixture are **proposed**, not frozen until the B1 definition gate is reviewed. The shared `@stack-parity/contracts` **HTTP response type** is distinct from Prisma ORM's **database data contract** (`contract.prisma` and its emitted JSON/types). Do not share database internals as the HTTP contract.

## Evidence-gated sequencing

### Gate B1-D — Design, compatibility and resource decision (NOW; docs only)

1. Confirm the smallest Product read contract and deterministic seed fixture.
2. Verify the **official, version-matched** Prisma Postgres and ORM/client integration path with the committed Prisma CLI `8.0.0-rc.22` and Composer `0.29.1`. Record supported APIs, local DB/test mechanism and any actual incompatibility; do **not** assume old Prisma examples apply.
3. Establish how the local test will prove data really came from persistence (not a Hono in-memory fixture): read a seeded row, change it *directly in the isolated test database*, read again, and verify the HTTP response reflects the change. Document an empty table and unavailable-DB negative test. Keep DB credentials out of Git.
4. Record the explicit non-production stage, expected resource usage/budget and teardown/retention owner, plus a **non-public stage seed/verification mechanism**; no unauthenticated HTTP write route or startup re-seeding is permitted. The still-live `spike-001` stage is **not** auto-deleted or repurposed.
5. Review and approve the B1 implementation acceptance criteria **before** opening a code PR or provisioning/deploying new cloud resources.

If any dependency cannot be verified, classify it `BLOCKED` with evidence; do not add technologies to bypass the gate.

### Gate B1-I — Implementation (NEXT; NOT YET AUTHORIZED)

Only after B1-D approval, in a separate scoped issue/PR and with one incremental testable change at a time:

1. Introduce the smallest real Postgres Product table, repeatable local database setup/seed, and version-supported persistence client. Use only the needed ORM/Composer dependencies already justified by B1.
2. Export the shared HTTP response contract and implement `GET /products` in the existing Hono public API. Keep the standalone runner and B0 `/health` test working without Composer. The current `src/local.ts` imports `src/app.ts` without a provisioned database, while `src/server.ts` is the Composer-managed entrypoint; resolve this with a **minimal explicit Product read dependency seam**, not a generic repository/DI framework.
3. Verify tests/typecheck/uncached build and real database-backed HTTP behavior locally.
4. Request **separate explicit cloud deployment approval** before publishing an isolated non-production Compute stage; capture external `GET /products` evidence, if approved.

## Candidate B1 implementation acceptance criteria (not yet executed)

- **B1-AC-01:** Clean frozen pnpm install and dependency/version compatibility documented.
- **B1-AC-02:** Hono uses the exported shared Product read contract, no source-relative cross-package import.
- **B1-AC-03:** A reproducible local seed persists at least one Product row in a **disposable, isolated test Postgres database**. An out-of-band test DB update changes the subsequent HTTP result; a mocked repository response alone is insufficient proof.
- **B1-AC-04:** `GET /products` returns the documented 200 JSON array shape with the seeded Product; empty table returns `[]`; missing/unavailable DB yields a non-200 response without leaking connection strings and never returns fabricated data. No public write endpoint is required to verify the data change.
- **B1-AC-05:** Typecheck, tests and **uncached** build pass; standalone HTTP and Composer-managed `GET /health` retain the previously verified response, without requiring DB provisioning merely to run the existing standalone health unit test.
- **B1-AC-06:** After **separate explicit** cloud approval and validation of a controlled non-public stage seed path, an isolated non-production Compute deploy succeeds and external `GET /products` returns database-backed JSON; without approval or a safe seed path, mark **PENDING/BLOCKED**, never PASS.
- **B1-AC-07:** Exact versions, commands, output, stage URL, secret redaction, warnings and limitations are recorded.

## Strict exclusions

No write endpoints or full CRUD, Customer/Order, search/filter/sort/pagination, pricing logic, storefront/admin/marketing apps, NestJS, auth, SDK codegen, generic DDD/repository abstractions, multiple databases or services, alternative providers, queues, Redis, advanced CI/CD or production deployment.

## Preliminary version-matched source review (2026-10-13)

This is **static source/documentation evidence, not a tested database integration**:

- [Current official Composer database guide](https://www.prisma.io/docs/composer/databases) documents two distinct paths: `rawPostgres()` (caller manages a SQL client/migrations) and `postgres()` (Prisma ORM data contract, typed client and managed migrations). This project's original [bootstrap brief](../bootstrap-brief-v0.1.md) **plans Prisma Postgres + ORM**, so switching to a raw-client design requires an explicit design decision, not an incidental shortcut.
- The upstream [Composer v0.29.1 ORM example](https://github.com/prisma/composer/tree/v0.29.1/examples/orm-demo) actually exists at the **same Composer tag** pinned in StackParity. It demonstrates a single Compute service plus one typed Postgres resource: [module wiring](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/module.ts), [service dependency](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/service.ts), [data contract](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/contract.ts), [CLI/ORM configuration](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/prisma.config.ts) and [runtime read](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/src/server.ts).
- **Version-number interpretation corrected:** the tagged Composer example uses `@prisma/orm-postgres@8.0.0-rc.17` alongside the Prisma CLI release line that includes `8.0.0-rc.22`. [Prisma ORM from-scratch documentation](https://www.prisma.io/docs/prisma-orm/from-scratch#prerequisites) explicitly says different CLI and ORM package version numbers are **normal** and even gives this pair as an example. The number difference is **not proof of incompatibility**; dependency resolution, contract emission, migration and real database runtime still require an executed **local** pinned-version check. Do not opportunistically upgrade packages.
- Local `prisma dev module.ts` can provision a local Postgres under the current [Composer guide](https://www.prisma.io/docs/composer/databases#local-databases), but StackParity has **not** executed that DB gate. Do not mark D-B1-01 resolved or provision a cloud database from these references alone.
- **Local safety constraint:** [Composer local-development documentation](https://www.prisma.io/docs/composer/local-development#whats-local-vs-whats-real) reports that `prisma dev module.ts --fresh` currently **fails when the app has a database** and can strand the local emulator. Do not use `--fresh` as B1's test reset/cleanup method; use an isolated, explicitly disposable test DB and a reviewed cleanup procedure. The same docs say native Windows `dev` is unsupported; use the already-established Linux Docker toolchain (or validated Linux environment), not new cross-platform tooling.
- **Existing Hono wiring check:** [standalone runner](../../services/public-api/src/local.ts) and [Composer entrypoint](../../services/public-api/src/server.ts) both import [the current app](../../services/public-api/src/app.ts), but only the latter has access to Composer service bindings. Preserve the B0 standalone `/health` seam while adding the single Product reader.
- **Stage caveat:** [Composer deploy docs](https://www.prisma.io/docs/composer/deploying#production-and-stages) say isolated stages own their databases. Planning must identify how B1 seed data reaches the chosen stage privately and repeatably **before** approving a paid deployment. Do not seed by adding an unauthenticated mutation endpoint or by overwriting `spike-001`.

## B1-D local compatibility preflight — executable protocol, NOT RUN

This is a **throwaway technical probe**, not a Product implementation, runtime dependency change, or production recipe. It must be conducted **outside the repository checkout**, in an explicitly identified, disposable Linux working directory. Stop and record `BLOCKED` if the environment or dependencies are unavailable. **Do not substitute** a cloud database or GitHub CI workflow.

### Phase A — read-only repository and toolchain checks

- Confirm `main`, root `package.json`, lockfile and existing `module.ts` match the B0 baseline; keep PR #5 docs-only.
- In the existing Docker **dev toolchain**, run `pnpm exec prisma --version` and inspect current `pnpm exec prisma contract --help` / `pnpm exec prisma migration --help` before selecting subcommands. No install, lockfile rewrite or resource operation is authorized by this phase.
- Review the immutable [Composer v0.29.1 ORM example](https://github.com/prisma/composer/tree/v0.29.1/examples/orm-demo) as source. Its `workspace:` and `catalog:` package references belong to Prisma's own monorepo: they cannot simply be copied into an independent StackParity installation. Do not claim a standalone install from the example without explicit dependency resolution.

### Phase B — disposable local runtime probe (requires a usable Linux Docker environment)

1. Prepare **one separate scratch checkout**, using a unique probe module/app name so the shared, persistent Prisma local emulators do not collide with `stack-parity` or other projects. Pin Composer to `0.29.1` and CLI to `8.0.0-rc.22`; select the ORM package from the upstream version-matched example and record its exact resolved peer tree. No dependency change to StackParity.
2. Model one disposable, read-only test result table with a simple `id/name` shape and validate `contract emit`. Record generated `contract.json` and `contract.d.ts` without secrets. Verify and record the supported **migration** command and successful table provisioning in a database owned by the probe.
3. Build and launch the **one-service, one-Postgres** Composer example locally, with `prisma dev module.ts` **without `--fresh`** and **without `deploy`**. The probe's HTTP listener must be loopback-only from the host's perspective. If the launcher does not actually provision DB and service, `BLOCKED`.
4. Query a known row through the **real** ORM client, edit the row by a separate, local-only database connection, and verify the second read reflects the changed value. Record both observations and the missing/unavailable DB negative result; mocked reads or the compiler alone do not establish persistence.
5. Stop the probe. Record any remaining local emulator-owned resources. **Never** delete or reset global emulator state, named volumes or other apps' resources automatically; document safe, ownership-checked cleanup separately before any destructive step.

The above is an **acceptance protocol**, not a claim of execution. The current assistant environment has Node but no Bun/pnpm/Docker/Postgres and cannot reach the npm registry; as of this review **Phase A/B have not been executed**. A successful probe would resolve only the *technical runtime* portion of D-B1-01, **not** stage seeding, billing, approval or B1 implementation authorization.

### Explicit outcome labels

- `STATIC_SOURCE_REVIEWED`: versioned examples and supported commands located; **current state**.
- `LOCAL_TOOLCHAIN_PASS`: exact read-only local commands and versions captured; not yet achieved.
- `LOCAL_DB_PASS`: real isolated Postgres migration plus repeated, changed-data reads; not yet achieved.
- `BLOCKED`: missing toolchain/credentials or reproducible incompatibility; capture the failing command and exit code, without improvising infra.
- `CLOUD_STAGE_PASSED`: **not eligible** under this B1-D planning gate.

## Decisions still open

- **D-B1-01:** Confirm Composer's ORM-backed `postgres()` path with the pinned toolchain using a minimal **executed** local check; version numbers differing alone are not a blocker.
- **D-B1-02:** Review the candidate `id/name` HTTP contract, deterministic row fixture and direct-database mutation proof; keep it read-only to callers.
- **D-B1-03:** Review the disposable local DB reset procedure, isolated stage's non-public seed mechanism, budget cap, owner and explicit teardown/retention decision.

**Exit from B1-D:** reviewer-approved acceptance scope, resolved D-B1-01..03, and a separate explicitly authorized implementation task. Opening this planning document alone is not approval.
