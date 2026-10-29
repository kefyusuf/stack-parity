# B1 Definition Gate — First Product Read API Slice

- **Status:** APPROVED — **B1-D closed 2026-10-27** (D-B1-01 runtime-resolved via `LOCAL_DB_PASS`; D-B1-02 contract scope approved by the reviewer; D-B1-03 local reset ratified and stage items deferred to the separately-authorized cloud step of B1-AC-06). B1-I implementation is **explicitly authorized as a separate task**; any cloud stage still requires its own approval.
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

## B1-D local compatibility preflight — Phase A PASS; Phase B NOT RUN

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

**User-executed B0 baseline verification: PASS 2/2 (2026-10-16).** In the separate B1-probe Compose project, using `run --rm --no-deps dev` (without published service ports):
- `pnpm typecheck` ran `tsc -p tsconfig.json --noEmit` without reported diagnostics. PowerShell explicitly printed `Typecheck exit: 0`.
- `pnpm test` invoked the existing public-api Bun test runner. `test/health.test.ts`: `GET /health returns the version from the shared contracts package` passed; reported `1 pass / 0 fail`, followed by `Test exit: 0`.
- `git -C $probe status --short` produced empty output after the tests; no tracked changes observed. A post-test Compose `ps --all` was not included in this evidence; `--rm` is the intended cleanup behavior, not independent proof of container state.

**Interpretation:** existing B0 typecheck/health unit test baseline **PASS** in the isolated probe; **no Product or Postgres integration test was run**. Do not infer anything about data contracts, ORM migrations or cloud compatibility from these tests.

**Independent build gate: subsequently PASS (2026-10-25).** The original `E:\projects\stack-parity-b1-probe` clone was intentionally removed during cleanup on 2026-10-24. The following evidence supersedes that path's preparation instructions; do not reuse the historical commands without re-establishing isolation.

The assistant ran an immutable archive of remote `main` at `eab6b2a85d46548fa3df3403c82c333d336e3bc6` inside a new disposable Linux volume, using the existing toolchain image and unique Compose project `stack-parity-b1-preflight-20261025`. Frozen install, all five version/help checks, typecheck, the existing health test and forced uncached build completed successfully. No application directory was bind-mounted for writing; the archive and check script were read-only inputs. Manifest, lockfile and workspace-policy SHA-256 checks remained unchanged. The temporary container, volume and network were removed; old projects' resources were untouched. See [exact commands, versions, results and cleanup evidence](B1-toolchain-preflight-20261025.md).

**Current result:** `LOCAL_TOOLCHAIN_PASS`; the previously pending uncached baseline build is closed. `LOCAL_DB_PASS` remains **NOT RUN**. Before any Phase B resource operation, review a concrete isolation and cleanup plan for its Composer module identity, emulator state, database and loopback-only listener. The existing `stack-parity` identity is not safe for that probe. No Product implementation, migration, database provisioning, `prisma dev`, stage deployment or cloud teardown was performed by this verification. Repository changes are confined to planning/evidence documentation on PR #5.

### Phase B — disposable local runtime probe (requires a usable Linux Docker environment)

**Preparation review (2026-10-25):** the [concrete isolation/cleanup proposal](B1-phase-b-isolation-plan.md) and [versioned source review](B1-phase-b-isolation-source-review.md) now specify a task-owned container/volume boundary, a unique module identity, an explicit emulator-state directory, shared private HOME/cache paths and a runtime with no external network or published ports. Compose configuration validation passed without starting resources. This is a proposal, not execution approval. Installed dependency state roots and first-use/offline asset behavior remain open; the source review records documentation drift beyond pinned CLI `8.0.0-rc.22`. The [pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) (2026-10-25) closed the source-review's dependency unknown at source level: exact `@prisma/dev@0.25.2` resolution, bundled PGlite engine assets with no first-use download indicated, `XDG_*`/`HOME`-based state roots covered by the planned redirections, and a new `bun`-on-`PATH` runtime requirement. The [scratch preparation review](B1-phase-b-scratch-preparation-20261025.md) (2026-10-25) then specified and test-validated the probe's standalone materialization — unique module identity, explicit ORM peer dependency, offline contract emission, CLI-authored migrations and a read-only loopback probe service — without executing any of it, and the [ownership review](B1-phase-b-ownership-review-20261025.md) (2026-10-25) passed 31 boundary assertions on the committed Compose fixture (sensitivity-proven), recorded empty task-label inventories and fixed the creation ledger. Review these prerequisites before any runtime launch. `LOCAL_DB_PASS` remains NOT RUN.

1. Prepare **one separate scratch checkout**, using a unique probe module/app name so the shared, persistent Prisma local emulators do not collide with `stack-parity` or other projects. Pin Composer to `0.29.1` and CLI to `8.0.0-rc.22`; select the ORM package from the upstream version-matched example and record its exact resolved peer tree. No dependency change to StackParity.
2. Model one disposable, read-only test result table with a simple `id/name` shape and validate `contract emit`. Record generated `contract.json` and `contract.d.ts` without secrets. Verify and record the supported **migration** command and successful table provisioning in a database owned by the probe.
3. Build and launch the **one-service, one-Postgres** Composer example locally, with `prisma dev module.ts` **without `--fresh`** and **without `deploy`**. The probe's HTTP listener must be loopback-only from the host's perspective. If the launcher does not actually provision DB and service, `BLOCKED`.
4. Query a known row through the **real** ORM client, edit the row by a separate, local-only database connection, and verify the second read reflects the changed value. Record both observations and the missing/unavailable DB negative result; mocked reads or the compiler alone do not establish persistence.
5. Stop the probe. Record any remaining local emulator-owned resources. **Never** delete or reset global emulator state, named volumes or other apps' resources automatically; document safe, ownership-checked cleanup separately before any destructive step.

The above is an **acceptance protocol**, not a claim of Phase B execution. Phase A reached `LOCAL_TOOLCHAIN_PASS` on 2026-10-25, including an assistant-executed Docker baseline build. No migration, database or external deployment was run. A successful Phase B probe would resolve only the *technical runtime* portion of D-B1-01, **not** stage seeding, billing, approval or B1 implementation authorization.

**Phase B executed (2026-10-27): `LOCAL_DB_PASS` (technical runtime portion).** With explicit user authorization, the probe ran from a task-owned directory outside the checkout against the committed fixtures: frozen prepare (install, offline contract emit, authored + self-attested migration, bun-built entry), offline `prisma dev` bootstrap with automatic migration apply, empty-table `200 {"ok":true,"results":[]}`, out-of-band `pg` seed and update reflected in subsequent ORM HTTP reads, and an unavailable-DB `503 {"ok":false}` with no fabricated data; ledger-compared teardown left zero task-labeled resources. Full commands, hashes and observations: [runtime probe evidence](B1-phase-b-runtime-evidence-20261027.md). Four execution-readiness defects were caught red-first by the committed checkers before launch (materialization overlay, migration body authoring, scratch-root entry layout, pre-built entry) — see the evidence document.

### Explicit outcome labels

- `STATIC_SOURCE_REVIEWED`: versioned upstream examples and supported commands located; completed as a static-source step.
- `CLI_HELP_OBSERVED`: historical partial evidence from 2026-10-13; superseded by the successful complete Phase A run documented above.
- `LOCAL_TOOLCHAIN_PASS`: **PASS (2026-10-25)** — frozen baseline install, CLI version/help, typecheck, health unit test and uncached build; exact commands and versions captured in the linked evidence report.
- `LOCAL_DB_PASS`: **PASS (2026-10-27)** — real isolated Postgres migration plus repeated, changed-data ORM reads and the unavailable-DB negative, in the reviewed disposable boundary; [evidence](B1-phase-b-runtime-evidence-20261027.md).
- `BLOCKED`: missing toolchain/credentials or reproducible incompatibility; capture the failing command and exit code, without improvising infra.
- `CLOUD_STAGE_PASSED`: **not eligible** under this B1-D planning gate.

## Decisions — closed 2026-10-27 (reviewer sign-off recorded in [the exit review](B1-d-exit-review-20261027.md))

- **D-B1-01: RESOLVED (runtime, 2026-10-27)** — Composer's ORM-backed `postgres()` path verified by the executed local probe (`LOCAL_DB_PASS`, [evidence](B1-phase-b-runtime-evidence-20261027.md)). No version upgrade was needed.
- **D-B1-02: APPROVED (2026-10-27)** — the candidate `{id, name}` HTTP contract, deterministic fixture semantics, internal `order by id`, empty-dataset shape, and out-of-band mutation proof are the binding acceptance scope for B1-I (AC-01..07). The probe exercised exactly this shape and mechanism.
- **D-B1-03: PARTIALLY RESOLVED (2026-10-27)** — the disposable local DB reset procedure is ratified (task-owned volume, ledger-compared teardown, never `--fresh`); the non-public stage seed mechanism is specified in advance and the budget cap / owner / teardown decision is **deferred to the separately-authorized cloud step** (B1-AC-06). `spike-001` remains live and untouched, with its retirement as a separate user-owned decision.

**Exit from B1-D: recorded 2026-10-27.** Reviewer-approved acceptance scope (D-B1-02), resolved D-B1-01, ratified D-B1-03 (local), and the separately authorized implementation task (B1-I) satisfy the exit conditions. Opening or merging planning documents alone never constituted approval; this closure records the reviewer's explicit decisions.
