# B1-D Phase B — Runtime Probe Evidence (2026-10-27)

**Result: `LOCAL_DB_PASS` (technical runtime portion).** The isolated Composer/Postgres probe executed end to end: real ORM reads against a disposable local Postgres, an out-of-band mutation reflected in the next HTTP read, and an unavailable-DB failure path returning 503 without fabricated data. This resolves only the **technical runtime portion of D-B1-01** — not stage seeding, billing, approval, or B1 implementation authorization (see [the B1 gate](B1-product-read-api-gate.md)).

## Provenance and isolation

- Execution date 2026-10-27, from a task-owned directory `E:\projects\stack-parity-b1-runtime-20261025` **outside the repository checkout**, deleted after cleanup. Compose project `stack-parity-b1-runtime-20261025`; fixtures copied byte-identical from the committed [`probe/b1-phase-b/`](../../probe/b1-phase-b/README.md) (`cmp`-verified).
- `baseline.tar`: SHA-256 `86fd920562008c3f9b7062befacc5e9787aa395f7ceb1f0877f7fd923d5a81fc` — identical to the Phase A preflight's immutable export of `main` at `eab6b2a85d46548fa3df3403c82c333d336e3bc6`.
- `probe-fixtures.tar` SHA-256 `12df3f1988b095b2db5b9fa5674f6a639ae89937ae225a434c2d6922259dedf4` (members: `prisma.config.ts`, `module.ts`, `probe/contract.prisma`, `probe/contract.ts`, `probe/service.ts`, `probe/server.ts`).
- Toolchain image rebuilt from the committed `Dockerfile.dev` (byte-identical to the baseline modulo CRLF checkout) as `stackparity-b1-probe-dev:latest` = `sha256:2ea151b932088e8f9d5c80ec3fac1ffa3e2627fd8c7277b56db0f8606eccec45`, user `node`; the checker verified tag→ID before launch. The previously pinned Phase A image had vanished from the host between two read-only inspections; recorded in [the ownership review](B1-phase-b-ownership-review-20261025.md).
- Pre-launch boundary check: `31 passed, 0 failed` (`COMPOSE_BOUNDARY_CHECK_PASS`) — no published ports, `network_mode: none` on runtime, no socket/credential mounts, task-owned HOME/XDG/TMPDIR/store/emulator roots, `pull_policy: never`. All HTTP/DB verification ran via `docker compose exec` inside the runtime container; no host listener existed at any point.

## Pre-execution corrections (each caught red-first by the committed checkers)

1. **Materialization gap:** `prepare.sh` never overlaid the probe fixtures onto the extracted baseline. Boundary checker `30/1` → fixture validator `55/1` → overlay step + fourth read-only mount added → `31/0` / `56/0`.
2. **Migration body:** `prisma migration new` only scaffolds (`operations: []`, `ops.json: []`); its help documents manual authoring + `node migration.ts` self-attestation. `prepare.sh` now authors the deterministic body (create schema `public`, create table `ProbeResult` with text `id`/`name`, `id` primary key — mirroring the tagged orm-demo shape) and runs the self-emit; validator `56/3` → `59/0`.
3. **Entry layout:** the first runtime launch failed `COMPOSE.ENTRY_UNLOADABLE` (`./probe/contract.ts` resolving to `probe/probe/…`). The module entry moved to the scratch root (orm-demo layout); `prisma dev module.ts`. Validator was red-first (`10` fails + command mismatch), then green.
4. **Build step:** the node build adapter requires a pre-built artifact (`ASSEMBLE.BUILD_FAILED`); `prepare.sh` now runs `bun build probe/server.ts --target=bun --outfile probe/dist/server.mjs` (orm-demo's documented flow). Validator `59/2` → final **`61/0`**.

## Preparation run (networked `prepare` service)

- Versions recorded in-container: Node `v24.22.1`, pnpm `11.28.5`, bun `1.4.3` (bun-on-`PATH` proven where the compute daemon needs it).
- `contract emit`: `ok:true`, storageHash `22fdc938789c610d95473a38633c26df41537e6b59a00fa6f97a441b444a1a67`, emitted `probe/contract.json` + `probe/contract.d.ts`.
- Migration scaffolded, body authored, self-attested: `ops.json` contains `CREATE SCHEMA public` + `CREATE TABLE "public"."ProbeResult" ("id" text NOT NULL, "name" text NOT NULL, PRIMARY KEY ("id"))` with `to_regclass` pre/postchecks; `migration.json` `to=22fdc938…`, `migrationHash=db346f59c72395b0bacdc090b3ba3309fca455f9086eebfc44390d4f060a6240`.
- Final marker `B1_SCRATCH_PREPARED`, exit `0`.

## Runtime run and acceptance sequence (offline runtime container)

Startup logs (trimmed): `[database-db] created`, `[database-conn] created`, `[database-warm] created`, **`[database-migrate] created`**, `[proberead-deploy] created`, `"status":"ready"`, endpoint `http://localhost:3000` (container-loopback only). The `[database-migrate]` line resolves the review's open point #1: **`prisma dev` applies pending migrations during local bootstrap.**

| # | Step | Observed result |
| --- | --- | --- |
| 1 | Empty-table read via HTTP inside container | `200` `{"ok":true,"results":[]}` |
| 2 | State file discovery | `@prisma/dev` server state exactly under `$XDG_DATA_HOME/prisma-dev-nodejs/pcdev-<module>-database/server.json`; daemon registries under `PRISMA_COMPOSER_EMULATORS_DIR/{compute,postgres}/apps.json` — both as [pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) predicted |
| 3 | Out-of-band seed via `pg` (connection string read from `server.json` `exports.database.connectionString`, **never printed** — length 70, redacted) | direct SQL rows `[{"id":"p-001","name":"Sample Product"}]` |
| 4 | ORM read via HTTP after seed | `200` `{"ok":true,"results":[{"id":"p-001","name":"Sample Product"}]}` |
| 5 | Out-of-band `UPDATE` via `pg` | — |
| 6 | ORM read via HTTP after update | `200` `{"ok":true,"results":[{"id":"p-001","name":"Sample Product (edited)"}]}` — **out-of-band mutation reflected in the next HTTP result** |
| 7 | `SIGTERM` to the pid recorded in `server.json` (the process hosting the dev server) | whole local stack stopped; HTTP fetch refused (non-200, no fabricated data) |
| 8 | Service reachable + DB unavailable (port `51300` → `ECONNREFUSED` verified) | **`503` `{"ok":false}`** — failure path, never an empty success or fabricated data |

The mocked-read shortcut did not exist anywhere: the only write paths were the direct `pg` connections in steps 3/5; the HTTP endpoint was strictly read-only (validator-enforced).

## Observations and limitations (recorded, not improvised)

- **Restart/strand behavior:** after the daemon kill, a container restart logged `Done: 0 succeeded` and did **not** re-ensure the database server (process re-ensured, listener absent). This is adjacent to the documented `--fresh` stranding warning and reinforces the isolation plan's prohibition on `--fresh` as a reset mechanism. No recovery was improvised; the volume was removed in cleanup.
- **Probe deviation from orm-demo:** the probe server intentionally omitted the demo's unhandled-rejection guards; the DB loss consequently stopped the app process (step 7) rather than logging. The Product implementation (B1-I) must include equivalent guards — this observation feeds that design.
- `node --version` in the rebuilt image is `v24.22.1` (base image moved since Phase A's `v24.21.0`); pnpm/bun pins unchanged.
- The local dev credentials embedded in toolchain URLs (`postgres:postgres@localhost:…`) are emulator-local, disposable with the volume, and were never printed in full.

## Cleanup (ledger-compared)

Pre-cleanup inventory matched the expected ledger exactly: container `…-runtime-1` (the one-off `prepare` containers had exited via `--rm`), volume `…_scratch`, network `…_default`. `docker compose down --volumes --remove-orphans` exited `0` and removed exactly those. Post-cleanup label-filtered inventories: **containers 0, volumes 0, networks 0**. The task directory was deleted. No other project's resources were touched; the live `spike-001` stage was never approached.

## Disposition

- **`LOCAL_DB_PASS` — achieved (2026-10-27)** for the technical runtime portion of D-B1-01: version-matched Composer `0.29.1` + CLI `8.0.0-rc.22` + ORM `8.0.0-rc.17` executed real migrations and real changed-data reads in an isolated, disposable boundary.
- **D-B1-02** (candidate `{id, name}` contract + fixture review) and **D-B1-03** (stage seed mechanism, budget cap, owner, teardown) remain reviewer decisions. B1 implementation (B1-I) remains unauthorized until the B1-D gate is explicitly approved.
