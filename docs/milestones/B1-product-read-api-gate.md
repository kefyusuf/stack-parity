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
- **Version provenance (review correction):** the tagged [Composer v0.29.1 workspace catalog](https://github.com/prisma/composer/blob/v0.29.1/pnpm-workspace.yaml) pins its *own* `prisma` CLI to `8.0.0-rc.19`; its [ORM demo manifest](https://github.com/prisma/composer/blob/v0.29.1/examples/orm-demo/package.json) uses `prisma: catalog:` and `@prisma/orm-postgres@8.0.0-rc.17`. **Separately**, the [Prisma ORM from-scratch guide](https://www.prisma.io/docs/prisma-orm/from-scratch#prerequisites) gives the `prisma@8.0.0-rc.22` + `@prisma/orm-postgres@8.0.0-rc.17` pair and says CLI and ORM version numbers need not match. StackParity currently runs CLI `8.0.0-rc.22`; unlike upstream Composer's own example, this precise Composer 0.29.1/CLI rc.22/ORM rc.17 combination is **not yet proven by a database-backed runtime test**. Different version numbers alone do not prove failure; do not upgrade opportunistically.
- Local `prisma dev module.ts` can provision a local Postgres under the current [Composer guide](https://www.prisma.io/docs/composer/databases#local-databases), but StackParity has **not** executed that DB gate. Do not mark D-B1-01 resolved or provision a cloud database from these references alone.
- **Local safety constraint:** [Composer local-development documentation](https://www.prisma.io/docs/composer/local-development#whats-local-vs-whats-real) reports that `prisma dev module.ts --fresh` currently **fails when the app has a database** and can strand the local emulator. Do not use `--fresh` as B1's test reset/cleanup method; use an isolated, explicitly disposable test DB and a reviewed cleanup procedure. The same docs say native Windows `dev` is unsupported; use the already-established Linux Docker toolchain (or validated Linux environment), not new cross-platform tooling.
- **Existing Hono wiring check:** [standalone runner](../../services/public-api/src/local.ts) and [Composer entrypoint](../../services/public-api/src/server.ts) both import [the current app](../../services/public-api/src/app.ts), but only the latter has access to Composer service bindings. Preserve the B0 standalone `/health` seam while adding the single Product reader.
- **Stage caveat:** [Composer deploy docs](https://www.prisma.io/docs/composer/deploying#production-and-stages) say isolated stages own their databases. Planning must identify how B1 seed data reaches the chosen stage privately and repeatably **before** approving a paid deployment. Do not seed by adding an unauthenticated mutation endpoint or by overwriting `spike-001`.

## B1-D local compatibility preflight — executable protocol, NOT RUN

This is a **throwaway technical probe**, not a Product implementation, runtime dependency change, or production recipe. It must be conducted **outside the repository checkout**, in an explicitly identified, disposable Linux working directory. Stop and record `BLOCKED` if the environment or dependencies are unavailable. **Do not substitute** a cloud database or GitHub CI workflow.

### Phase A — read-only repository and toolchain checks

- Confirm `main`, root `package.json`, lockfile and existing `module.ts` match the B0 baseline; keep PR #5 docs-only.
- In the existing Docker **dev toolchain**, run `pnpm exec prisma --version` and inspect current `pnpm exec prisma contract --help` / `pnpm exec prisma migration --help` before selecting subcommands. **User-provided help outputs were observed on 2026-10-13, but `$LASTEXITCODE` values have not been captured** (see below). No install, lockfile rewrite or resource operation is authorized by this phase.
- Review the immutable [Composer v0.29.1 ORM example](https://github.com/prisma/composer/tree/v0.29.1/examples/orm-demo) as source. Its `workspace:` and `catalog:` package references belong to Prisma's own monorepo: they cannot simply be copied into an independent StackParity installation. Do not claim a standalone install from the example without explicit dependency resolution.

### Phase A observed evidence (2026-10-13, Windows PowerShell + existing Docker dev)

Source: user-pasted, unedited terminal excerpts from `E:\\projects\\stack-parity`. This is **user-executed evidence**, not an assistant-initiated Docker run. Container creation messages appeared for each one-off command; the shell returned to the prompt. Explicit `$LASTEXITCODE` values were not supplied, so do not invent exit-code zero.

| Command (run using `docker compose run --rm dev ...`) | Observed result |
| --- | --- |
| `pnpm exec prisma --version` | `8.0.0-rc.22` |
| `pnpm exec prisma contract --help` | Subcommands `emit`, `infer`, `format`, `print` listed |
| `pnpm exec prisma migration --help` | `check`, `graph`, `list`, `log`, `new`, `plan`, `show`, `status`, `ref` listed; help says **apply with `db migrate`** |

Both help outputs reported: `Prisma agent skills are out of date (installed @prisma/orm-postgres 8.0.0-rc.17, synced none). Run: prisma skills sync`. This reports a detected ORM version and missing skill synchronization; it does **not** independently establish a successful direct ORM install in StackParity's root manifest, a functional DB connection, or a failing CLI command. Skill sync is not part of this gate.

**Evidence classification: `CLI_HELP_OBSERVED` (partial Phase A).** CLI surface and version are visible; explicit exit codes, verified environment provenance and all Phase B integration evidence remain open. No migrations were planned/applied, no contract artifacts generated, no database provisioned, and no cloud deploy executed as part of these commands.

### Phase A targeted command checks — user-executed PASS (2026-10-13)

From Windows PowerShell in the existing `E:\projects\stack-parity` checkout, both **read-only help commands** ran inside `docker compose run --rm dev` and the user captured `$LASTEXITCODE = 0` after each:

| Command (under `pnpm exec prisma`) | Observed behavior | Exit code |
| --- | --- | --- |
| `contract emit --help` | Shows offline artifact emission of `contract.json` and `contract.d.ts`, with `--output-path` support. No emit was performed. | `0` |
| `db migrate --help` | Shows migration application command; `--db <url>`, `--to`, `--advance-ref` and read-only `--show` preview. No migration was applied. | `0` |

Both help commands again emitted `Prisma agent skills are out of date (installed @prisma/orm-postgres 8.0.0-rc.17, synced none)`. Because the help commands completed successfully and no integration was attempted, this remains a **non-blocking advisory** for Phase A; no skills sync is justified by this observation.

**Outcome:** targeted help subgate `PASS 2/2`; overall Phase A is still **partial** because the earlier three commands have output but no recorded exit codes, and the disposable-probe environment has not been verified. This is **not** a successful `contract emit`, migration, Postgres connection or ORM runtime test.

**Next gate:** inspect local working-tree status/branch and disposable-probe environment ownership **without modifying this repository**. Only after the probe isolation is verified, plan actual emission/migrations inside that separate probe.

Do not execute `contract emit`, `migration plan`, `db migrate` or `prisma dev` in the existing StackParity workspace as a shortcut. These can generate artifacts, create state or apply schema changes; the isolated probe boundary remains mandatory.

### Phase A Git checkout evidence — user-executed (2026-10-13)

Windows PowerShell in `E:\projects\stack-parity` returned:

| Read-only command | Observed outcome |
| --- | --- |
| `git status --short` | Empty output — clean working tree |
| `git branch --show-current` | `spike/compute-monorepo-foundation` |
| `git rev-parse HEAD` | `6eeb2729a8045186a0b82b5eec7047bf1c6df2a2` |

Confirmed separately from GitHub: this SHA is the head of **already squash-merged PR #3**; current remote `main` is `eab6b2a85d46548fa3df3403c82c333d336e3bc6`. A clean, non-main checkout is **not** proof that the local branch includes B0's squash-merge commit or B1 planning work.

**Isolation decision:** leave the original checkout, its checked-out branch, Git metadata, Docker services/volumes and files untouched. Use a sibling directory **only after verifying that the target path does not already exist**. A new single-branch clone of remote `main` is preferred over a linked Git worktree because it avoids writing worktree metadata to the original checkout's `.git` directory. No probe command is authorized against the original checkout.

**Next non-destructive preparation:** test whether `E:\projects\stack-parity-b1-probe` exists; if absent, clone remote `main` into that directory. Verify the clone's HEAD equals the reviewed remote `main` SHA and its working tree is clean. **Stop before** dependency install, schema edits, Composer emulator launch or any Docker/Prisma provisioning. Merely cloning is not evidence of an isolated emulator or DB; unique project/module and owned-resource configuration must be reviewed first.

### Phase A verified independent checkout (user-executed, 2026-10-16)

The user created a separate `E:\projects\stack-parity-b1-probe` checkout. The following read-only outputs were inspected:

| Check | Evidence |
| --- | --- |
| `git -C $probe status --short` | Empty output; clean worktree |
| `git -C $probe branch --show-current` | `main` |
| `git -C $probe rev-parse HEAD` | `eab6b2a85d46548fa3df3403c82c333d336e3bc6` |
| `git -C $probe remote get-url origin` | `https://github.com/kefyusuf/stack-parity.git` |

The remote `main` ref was independently read from GitHub and matched that exact SHA. **Independent checkout gate PASS.** No clone dependency install, Compose container launch, migration, Postgres or Prisma runtime test is implied by these Git commands.

**Discovered isolation risks in `main`:**

- `compose.yaml` exposes `127.0.0.1:3000:3000` and declares three named dependency volumes. A separate directory is not enough to safely launch a second HTTP process while the original could own port 3000. Use an explicit unique Compose project name and review volume names before **any** `up`/`run`/`build`.
- `module.ts` still declares `module("stack-parity", ...)`, independently of the local directory. **Do not run `prisma dev` from the clone** before isolating the Composer module/app identity and determining any shared local-emulator state.
- The B1 clone is baseline-only: it does not include the Draft PR #5 design-gate document. Keep PR #5 documentation in its own branch; do not cherry-pick draft planning commits into the probe just to test tools.

**Next safe inspection, from any PowerShell working directory** (read-only; does not start containers):

```powershell
$probe = 'E:\projects\stack-parity-b1-probe'
docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe config --services
$LASTEXITCODE
docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe config --volumes
$LASTEXITCODE
docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe ps --all
$LASTEXITCODE
```

**User-executed Compose inspection (2026-10-16): PASS 3/3.** With `--project-directory E:\\projects\\stack-parity-b1-probe`, `-f ...\\compose.yaml`, and `-p stackparity-b1-probe`:
- `config --services` showed only `dev`; exit code `0`.
- `config --volumes` listed exactly `api_node_modules`, `workspace_node_modules`, `contracts_node_modules`; exit code `0`.
- `ps --all` printed only the header, with no service container entries; exit code `0`.

This checks **Compose config and project-specific container inventory** only. Logical `config --volumes` names are not evidence that no Docker volumes exist; no images, networks or data were created by these inspection commands. `module.ts` still uses the original Composer app name `stack-parity` and remains **unsafe for an isolated Prisma dev launch**. The existing host port binding `127.0.0.1:3000` must not be published by the probe.

**User-executed isolated toolchain image build: PASS (recorded 2026-10-16).** From PowerShell with the same `-p stackparity-b1-probe` and `--project-directory $probe`:
- `docker compose ... build dev` finished all 11/11 BuildKit steps, mostly cached, and reported `Image stackparity-b1-probe-dev Built` with `$LASTEXITCODE = 0`.
- `docker compose ... ps --all` returned a header without containers and `$LASTEXITCODE = 0`.
- The created image tag is `stackparity-b1-probe-dev:latest`; no Hono process, PostgreSQL, Prisma Composer emulator or cloud stage is shown as started. Docker image/build-cache writes are expected; **do not infer that any named volumes have already been created**.

**Dependency-install gate (NEXT; disposable probe only):** remote `main` includes a checked-in `pnpm-lock.yaml` (lockfile v9) with Composer `0.29.1`, CLI `8.0.0-rc.22`, and reviewed Effect RC overrides. The workspace's `strictDepBuilds: true` policy only explicitly allows `esbuild` and `workerd` lifecycle scripts. Install **without updating the lockfile or package manifests**:

```powershell
$probe = 'E:\projects\stack-parity-b1-probe'
docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe run --rm --no-deps dev pnpm install --frozen-lockfile --reporter=append-only
$LASTEXITCODE
git -C $probe status --short
docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe ps --all
$LASTEXITCODE
```

This step **does create a temporary one-off container**, a probe-owned Compose network and **three new named dependency volumes** (which persist after `--rm`); it may download packages from the registry and execute the permitted lifecycle scripts. `run` does not publish the service's configured host port unless `--service-ports` is specified; **do not add it**. The distinct `-p` protects the original project's named volumes. Require install exit code 0, no tracked file changes, and no lingering probe containers to accept this gate. Record ownership; never use `down -v`, pruning, broad script permissions, force upgrades or global cleanup on failure.

**User-executed frozen dependency install: PASS (2026-10-16).** In the separate `E:\projects\stack-parity-b1-probe` checkout, the user executed `docker compose --project-directory $probe -f "$probe\compose.yaml" -p stackparity-b1-probe run --rm --no-deps dev pnpm install --frozen-lockfile --reporter=append-only`. The terminal excerpt showed `Done in 33.7s using pnpm v11.28.5` and an explicitly captured `Install exit code: 0`. Subsequent `git -C $probe status --short` produced **no output**. The `ps --all` output showed a header without running/stopped probe containers; its own exit code was not separately captured.

**Interpretation:** successful reproducible install at committed lockfile versions, with no tracked working-tree changes and no leftover one-off container visible. Three **probe-owned** named dependency volumes may remain intentionally; an empty container list is **expected** after `run --rm`. Do not delete these volumes or use `down -v`. This PASS does not imply a running Compose service, application tests, ORM contract emission, Postgres access or cloud validation.

**Next isolated baseline checks (no DB or emulator):** from the same probe Compose project, run `pnpm typecheck` and `pnpm test` in one-off `run --rm --no-deps dev` containers, capture each exit code, and stop at the first failure. These exercise the existing B0 TypeScript/Hono smoke suite. Avoid `up` or `--service-ports`; don't attach to port 3000. Check `git status --short` and `ps --all` afterward. The uncached build can be checked in a separate gate.

**Still prohibited:** Compose `up`, `prisma dev`, schema/migration changes, `deploy`, Postgres provisioning, and any change to the original `E:\projects\stack-parity` checkout. Passing dependency install or B0 baseline tests alone does not establish `LOCAL_DB_PASS`.

### Phase B — disposable local runtime probe (requires a usable Linux Docker environment)

1. Prepare **one separate scratch checkout**, using a unique probe module/app name so the shared, persistent Prisma local emulators do not collide with `stack-parity` or other projects. Pin Composer to `0.29.1` and CLI to `8.0.0-rc.22`; select the ORM package from the upstream version-matched example and record its exact resolved peer tree. No dependency change to StackParity.
2. Model one disposable, read-only test result table with a simple `id/name` shape and validate `contract emit`. Record generated `contract.json` and `contract.d.ts` without secrets. Verify and record the supported **migration** command and successful table provisioning in a database owned by the probe.
3. Build and launch the **one-service, one-Postgres** Composer example locally, with `prisma dev module.ts` **without `--fresh`** and **without `deploy`**. The probe's HTTP listener must be loopback-only from the host's perspective. If the launcher does not actually provision DB and service, `BLOCKED`.
4. Query a known row through the **real** ORM client, edit the row by a separate, local-only database connection, and verify the second read reflects the changed value. Record both observations and the missing/unavailable DB negative result; mocked reads or the compiler alone do not establish persistence.
5. Stop the probe. Record any remaining local emulator-owned resources. **Never** delete or reset global emulator state, named volumes or other apps' resources automatically; document safe, ownership-checked cleanup separately before any destructive step.

The above is an **acceptance protocol**, not a claim of Phase B execution. Phase A has user-provided CLI version/help output (recorded above) but has not reached full `LOCAL_TOOLCHAIN_PASS`. The assistant has not run Docker, migrations, a database or external deployment. A successful probe would resolve only the *technical runtime* portion of D-B1-01, **not** stage seeding, billing, approval or B1 implementation authorization.

### Explicit outcome labels

- `STATIC_SOURCE_REVIEWED`: versioned upstream examples and supported commands located; completed as a static-source step.
- `CLI_HELP_OBSERVED`: initial version/top-level help text received without recorded exit codes; the additional two targeted help commands each exited `0` (2026-10-13). **Current partial Phase A state**.
- `LOCAL_TOOLCHAIN_PASS`: exact read-only local commands and versions captured; not yet achieved.
- `LOCAL_DB_PASS`: real isolated Postgres migration plus repeated, changed-data reads; not yet achieved.
- `BLOCKED`: missing toolchain/credentials or reproducible incompatibility; capture the failing command and exit code, without improvising infra.
- `CLOUD_STAGE_PASSED`: **not eligible** under this B1-D planning gate.

## Decisions still open

- **D-B1-01:** Confirm Composer's ORM-backed `postgres()` path with the pinned toolchain using a minimal **executed** local check; version numbers differing alone are not a blocker.
- **D-B1-02:** Review the candidate `id/name` HTTP contract, deterministic row fixture and direct-database mutation proof; keep it read-only to callers.
- **D-B1-03:** Review the disposable local DB reset procedure, isolated stage's non-public seed mechanism, budget cap, owner and explicit teardown/retention decision.

**Exit from B1-D:** reviewer-approved acceptance scope, resolved D-B1-01..03, and a separate explicitly authorized implementation task. Opening this planning document alone is not approval.
