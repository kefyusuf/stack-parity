# B1-I Implementation Evidence — First Product Read Slice (2026-10-28)

**Status: implemented and locally verified. AC-06 (cloud) remains PENDING a separate approval.** Implementation: Issue [#6](https://github.com/kefyusuf/stack-parity/issues/6), draft PR #7, branch `b1/product-read-slice`. Scope source: the reviewer-approved [B1-D exit review](B1-d-exit-review-20261027.md) (D-B1-02 binding scope; D-B1-03 local reset ratified, stage items deferred).

## Acceptance criteria status

| AC | Status | Evidence |
| --- | --- | --- |
| **AC-01** clean frozen install + dependency compatibility | **PASS** | Branch lockfile updated for exactly two additions (below); `pnpm install --frozen-lockfile` PASS in a clean task volume (unit 2 prepare, 2026-10-28) and re-checked on the final tree (unit 3 verification). Composer `0.29.1` / CLI `8.0.0-rc.22` / ORM exact peer `8.0.0-rc.17` unchanged from the pinned closure — no upgrade was needed. |
| **AC-02** shared contract by package boundary | **PASS** | `GET /products` types come from `@stack-parity/contracts` (`ProductReadItem` / `ProductReadResponse`); no source-relative cross-package import; the ORM data contract (`services/public-api/contract.prisma` + emitted artifacts) stays separate from the HTTP contract. |
| **AC-03** reproducible seed + out-of-band mutation proof | **PASS** | Real disposable Postgres (offline runtime container, task-owned volume): empty read → out-of-band seed → HTTP shows row → out-of-band `UPDATE` → HTTP shows the changed value (`"Sample Product (edited)"`). Mocked reads were never used as proof; the only writes were direct `pg` connections. Reproducibility: committed deterministic seed script + auto-applied attested migration. |
| **AC-04** shapes + failure behavior | **PASS** | Empty table → `200 {"products":[]}`; seeded → `200` with the row; table removed → `503 {"error":"product read unavailable"}` with a clean leak-check (no connection strings); table restored → `200` recovery. `GET /products` on the DB-less standalone runner also fails closed (`503`). |
| **AC-05** typecheck/tests/uncached build; B0 surfaces retained | **PASS** | Final tree: `tsc --noEmit` exit 0; `bun test` 5 pass / 0 fail (no DB needed for the suite); `turbo run build --force` (uncached) 1/1 + artifact; standalone HTTP check: `/health` → `200 {"status":"ok","contractVersion":"spike-001"}` unchanged, `/products` → `503` without DB. |
| **AC-06** isolated non-production Compute deploy | **PENDING** | Requires the separate cloud approval deferred by D-B1-03 (private seed path is now materialized as the seed script; budget/owner/teardown inputs still owed). Never labeled PASS without it. |
| **AC-07** versions/commands/outputs/redaction/limitations recorded | **PASS** | This document plus the unit-2 evidence comment on PR #7; all connection strings redacted (lengths only); task directories deleted after ledger-matched teardowns (0/0/0). |

## Dependency and version matrix (AC-01)

| Package | Version | Note |
| --- | --- | --- |
| `@prisma/composer`, `@prisma/composer-prisma-cloud` | `0.29.1` | unchanged (B0 pins) |
| `prisma` CLI | `8.0.0-rc.22` | unchanged |
| `@prisma/orm-postgres` | `8.0.0-rc.17` | **added, exact peer** of composer-prisma-cloud (declared explicitly per the pinned source closure — not relied on as an implicit auto peer) |
| `pg` | `8.22.0` | **added** (verification/seed client; matches the version already resolved transitively; `8.23.1` exists but was not taken) |
| Effect RC overrides / `strictDepBuilds` | unchanged | `pnpm-workspace.yaml` untouched |
| Toolchain | Node `v24.22.1`, pnpm `11.28.5`, bun `1.4.3` | rebuilt toolchain image `sha256:2ea151b9…` (ownership review amendment) |

## Committed implementation surface

- `packages/contracts`: `ProductReadItem` / `ProductReadResponse` (approved scope, frozen by D-B1-02).
- `services/public-api`: `contract.prisma` (Product, id/name) → emitted `contract.json` / `contract.d.ts` (storageHash `c5e8c20a65e7a2d6bc8dc1405e289b7377520cb22097b5dbc3480c1f337ee7dd`); attested migration `migrations/app/20261028T1823_product_init` (`migrationHash b1377c49…`, ops: `CREATE SCHEMA public` + `CREATE TABLE "public"."Product"`); re-attestation against the committed snapshot bytes reproduced the same hash (drift check PASS).
- `services/public-api/src`: `ProductReader` seam + fail-closed unconfigured reader; `createApp(readProducts)`; typed ORM reader bound at the Composer-managed entry via `service.load()` (hydrated deps) and `service.port()`; **process-level `unhandledRejection` / `uncaughtException` guards** (the B1 probe died without them; the service survived the induced read failure).
- `module.ts`: postgres resource (`id: "database"`) + `publicApi` db binding. ⚠️ **Deploying this graph to any stage (including the live `spike-001`) creates that database on the stage and requires the separate B1-AC-06 approval; `compute:deploy` was not run.**
- `services/public-api/scripts/seed.mjs` (+ `pnpm seed`): the D-B1-03-approved private seed mechanism materialized — deterministic, idempotent, `DATABASE_URL` from the environment, connection string never printed and redacted from errors. Reusable unchanged for the future stage step.

## Real-database acceptance run (2026-10-28, unit 2; unchanged code paths for unit 3)

Offline runtime container (`network_mode: none`, loopback-only, task-owned volume, project `stack-parity-b1-product-20261027`, verification via `exec` only — no published ports):

| Step | Observed |
| --- | --- |
| Bootstrap | `[database-migrate] created` — committed migration auto-applied; `"status":"ready"` |
| `GET /health` | `200 {"status":"ok","contractVersion":"spike-001"}` |
| `GET /products` (empty) | `200 {"products":[]}` |
| Seed via `pg` (URL read from `server.json` `exports.database.connectionString`, never printed — length 70, redacted) | — |
| `GET /products` after seed | `200 {"products":[{"id":"p-001","name":"Sample Product"}]}` |
| Out-of-band `UPDATE` → `GET /products` | `200 {"products":[{"id":"p-001","name":"Sample Product (edited)"}]}` |
| Table renamed away | `503 {"error":"product read unavailable"}`, leak-check clean |
| Table restored | `200` with data |

Cleanup: ledger-matched (`…runtime-1`, `…_scratch`, `…_default`) → post-cleanup inventories 0/0/0; task directory deleted; `spike-001` untouched; zero cloud operations.

## Warnings and limitations

1. **AC-06 pending:** no cloud claim is made; the live `spike-001` stage is untouched and its retirement remains a separate user-owned decision.
2. The unit-2 verification harness (compose fixture + prepare script) ran from a task-owned copy outside the repository and was **not committed**; the committed reproducibility surface is the migration + seed script. A reusable product-level harness can be a follow-up if wanted.
3. Emitted `contract.json` is committed pretty-printed; whitespace-only differences from a fresh `prisma contract emit` are expected. The hash-relevant snapshot files are consistent (attestation drift check passed).
4. `node migration.ts` (self-attest) resolves `prisma.config.ts` from the working directory — run it from `services/public-api`, not the repo root.
5. The standalone runner binds `0.0.0.0` for the B0 Docker workflow; without a database it answers `GET /products` with `503` — this is the designed fail-closed behavior, not a defect.
