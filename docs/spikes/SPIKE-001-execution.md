# SPIKE-001 Execution & Evidence

**Status: IN PROGRESS — Composer local dev reached 'dev: ready'; Composer-served HTTP, committed lockfile, and remote deploy pending**
**Issue:** #1
**Branch:** `spike/compute-monorepo-foundation`

## Environment

The branch was prepared without access to a compatible local Node/Bun/pnpm package installation environment. The user's initial Docker installation was interrupted, but after fixing the pnpm 11 lifecycle script policy, the user confirmed exit code `0` for both `pnpm install --reporter=append-only` and `pnpm rebuild esbuild workerd` (2026-10-12). A `pnpm-lock.yaml` file was committed to this branch on 2026-10-12 (`2395318b27e80a3287da73a32fe26791c2e93f5c`). Its workspace importers and pinned versions have been inspected structurally, but a frozen-lockfile reinstall has **not** been reported. The user also reported exit code `0` for typecheck, unit tests, and build. The user reports that port 3000 responds without a problem on 2026-10-12; the full HTTP status and JSON body were not captured in chat. Composer and cloud deployment remain unverified.

Version selections in `package.json` are provisional and **must be resolved by a real install**. The resulting `pnpm-lock.yaml` is required for the acceptance gate.

## Optional Docker development path

For users without host Node.js/Bun/pnpm, use the [Docker guide](SPIKE-001-docker.md).
This provides a containerized install, typecheck, unit test, build and standalone HTTP smoke test.
It does **not** replace the Composer-specific local or cloud deployment gates.

## Local preparation

Prerequisites:
- Node.js 22.18+, preferably the Node 24 version in `.nvmrc`
- Bun available on PATH
- pnpm matching the repository `packageManager` field
- a working npm package registry connection

From the repository root:

```bash
node --version
bun --version
pnpm --version
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm compute:dev
```

Prisma may require the version-specific skills sync before the local Composer run:

```bash
pnpm exec prisma skills list
pnpm exec prisma skills sync
```

Keep agent-specific skill configuration opt-in; do not install global agent configuration. Follow instructions produced by the **installed** Prisma CLI rather than assuming future interfaces.

In a second terminal, use the local URL printed by `prisma dev`:

```bash
curl -i <local-service-url>/health
```

Expected HTTP 200 JSON:

```json
{"status":"ok","contractVersion":"spike-001"}
```

## Remote gate

Only after a successful local run:

```bash
pnpm exec prisma auth whoami
```

If not signed in, a human operator must complete:

```bash
pnpm exec prisma auth login
```

Then execute:

```bash
pnpm build
pnpm compute:deploy
curl -i <remote-service-url>/health
```

Use the public URL actually returned by the deployment. Do not invent it. No secret values should be committed.

## User-provided Docker diagnostic (2026-10-12)

Observed from Windows Docker Desktop logs (paths and transient container IDs omitted):

- `docker compose build dev` **succeeded**.
- `docker compose run --rm dev pnpm install` resolved a large dependency graph and reported `24 deprecated subdependencies`, an informational warning.
- A transient npm registry `ERR_PNPM_ENODATA` fetch retry was visible but did not establish a final install failure.
- Install progress ended at `resolved 589, reused 0, downloaded 444, added 441` and then `^C`. No success/exit code was captured.
- Subsequent `pnpm typecheck`, `pnpm test`, and `pnpm build` attempts again showed installation progress and ended with `^C`, not successful task output.
- No persistent HTTP container run was recorded. The original Compose service only printed the pnpm version on `up`; it did not serve `/health`.

### Corrective change (not yet runtime verified)

1. Default Compose command now launches the standalone Hono server after a complete install.
2. pnpm's content-addressable store is configured under Docker's Linux `workspace_node_modules` volume rather than `/workspace/.pnpm-store` on the Windows project bind mount.
3. A container healthcheck checks `GET /health`.
4. Documentation requires a completed install before checking types/build/tests and uses `docker compose up -d dev` to keep the HTTP service alive.

No `deprecated` dependency has been upgraded solely to hide warning output. These changes address local dev setup only; Prisma Composer and remote deployment checks remain independent gates.

## User-provided pnpm 11 install output (2026-10-12, second attempt)

The subsequent Docker install **downloaded and linked all 442 packages** and ended with `added 442, done`. However, the installer then emitted:

```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.28.2, workerd@1.20260901.1
```

This is a **real install failure under pnpm 11**, even though package installation progress reached `done`. It is not caused by deprecated package warnings. The transient `UND_ERR_SOCKET` error recovered and the pnpm store moved to `/workspace/node_modules/.pnpm-store/v11` as intended.

**Narrow corrective change:** `pnpm-workspace.yaml` now specifies `strictDepBuilds: true` and `allowBuilds: { esbuild: true, workerd: true }`. This follows pnpm 11 security policy; it does not relax checks for future dependencies. Execute `pnpm install` again, then `pnpm rebuild esbuild workerd` to run previously blocked lifecycle scripts. **User-reported retest:** both commands completed with exit code `0` on 2026-10-12. Full logs were not captured; clean install from a committed lockfile remains unverified.

The install log also mentions unresolved peer dependencies. Run `pnpm peers check` after a successful install and record details without speculative upgrades.

## User-reported success (2026-10-12)

The user reported exit code `0` for both commands after the allowBuilds change:

```powershell
docker compose run --rm dev pnpm install --reporter=append-only
docker compose run --rm dev pnpm rebuild esbuild workerd
```

This validates the immediate installer/rebuild blocker **as user-reported execution evidence**. It does not establish a clean frozen-lockfile install, correct runtime behavior, or any Prisma Compute deployment. The lockfile is now committed to the GitHub branch; verify a frozen-lockfile install before merging. The user subsequently reported exit code `0` for `pnpm typecheck`, `pnpm test`, and `pnpm build` inside the Docker toolchain. The next gate is the standalone Docker HTTP check. Full command output is not attached, so the result is marked user-reported.

## User-reported validation (2026-10-12)

The user confirms exit code `0` for each of:

```powershell
docker compose run --rm dev pnpm typecheck
docker compose run --rm dev pnpm test
docker compose run --rm dev pnpm build
```

This is **user-reported exit-code evidence**, not an independently captured test log. It supports moving to a standalone Docker HTTP smoke check without marking the entire SPIKE-001 PASS.

## Local Docker HTTP report (2026-10-12)

The user reports port `3000` is reachable and working following `docker compose up -d dev`. This confirms a useful local smoke result, but **the exact** `curl.exe -i http://localhost:3000/health` **status line and body have not been captured**. Do not mark the contract-specific HTTP assertion PASS without confirming `HTTP 200` and `contractVersion: "spike-001"`.

The generated `pnpm-lock.yaml` was subsequently committed. The next non-code task is validating `pnpm install --frozen-lockfile` and collecting the exact HTTP status and response JSON. No scope expansion is authorized.

## GitHub verification (2026-10-12)

- `pnpm-lock.yaml` is committed on `spike/compute-monorepo-foundation`, commit `2395318b27e80a3287da73a32fe26791c2e93f5c`.
- Static inspection confirms lockfile v9, root importer, contracts workspace importer, public-api importer, workspace link to `@stack-parity/contracts`, and the expected pinned dependency versions.
- No need to regenerate or upgrade the lockfile merely because pnpm prints an update notice.
- **Remaining acceptance proof**: `docker compose run --rm dev pnpm install --frozen-lockfile` exits 0, plus `curl.exe -i http://localhost:3000/health` visibly returns HTTP 200 and `{"status":"ok","contractVersion":"spike-001"}`.
- Neither check has been independently run by the assistant (Docker is unavailable in this execution environment). Composer `dev` and remote deployment remain separate pending gates.

## User follow-up (2026-10-12): frozen installation and HTTP check

The user confirmed that the previous validation steps completed without issues. The immediately preceding instructions were:

```powershell
docker compose run --rm dev pnpm install --frozen-lockfile
curl.exe -i http://localhost:3000/health
```

Classify these as **user-reported successful**. The raw frozen-install exit code, HTTP status line, and JSON body are not attached in the conversation. The assistant has not performed an independent Docker execution, so those exact fields remain evidence to capture before final closure. The committed lockfile already exists; do not regenerate or upgrade it merely for this gate.

## Composer graph validation failure (2026-10-12)

The first user-run `docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev` stopped with **exit code 2**:

```text
[COMPOSE.GRAPH_INVALID] provision() id "public-api" (module "stack-parity")
must contain only ASCII letters and digits ([A-Za-z0-9])
```

**Root cause:** `compute({ name: "public-api" })` in `services/public-api/src/service.ts` becomes the default graph `provision()` ID. The hyphen is not accepted in that address segment. This is **not** a Docker or Hono failure.

**Minimal fix:** changed only the Composer service node `name` to `"publicApi"`. The directory `services/public-api`, npm workspace package `@stack-parity/public-api`, public `/health` endpoint, and root module name `"stack-parity"` remain unchanged. Prisma documentation confirms the provision ID defaults to the node's name; module display names may include hyphens.

**Separate advisory:** The CLI also printed `Prisma agent skills are out of date ... Run: prisma skills sync`. This did not cause `COMPOSE.GRAPH_INVALID`; a skill sync is not a graph validation or runtime fix. Avoid changing agent skill configuration as part of this one-line correction.

**Retest:** fetch the new commit, rerun `pnpm build` inside Docker (the build artifact contains the Composer service declaration), then run `pnpm compute:dev` again. Preserve the next CLI output rather than assuming the first error was the only blocker. No successful Composer boot or Compute deployment has been observed.

## Next gate: Composer-managed local execution (no cloud credentials)

Prisma's current Composer documentation requires a build before `prisma dev module.ts`. The existing script `pnpm compute:dev` invokes that command. Unlike the standalone Hono container, this runs the Composer declaration/runtime pipeline.

**Do not assume that a port printed as `localhost` inside Docker is reachable on Windows.** Run a separate disposable container and test the actual port from **inside that same container**. The existing Hono `dev` service can remain running because the one-off container does not publish the host's 3000 port.

PowerShell terminal 1:

```powershell
git switch spike/compute-monorepo-foundation
git pull --ff-only
docker compose run --rm dev pnpm build
docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev
```

Wait for `dev: ready` and copy the port printed for `public-api`. If Composer reports an error before ready, record that error and stop; **do not** infer the reason or modify Docker again without evidence.

PowerShell terminal 2, with the port replaced by the one Composer printed (3000 is illustrative only):

```powershell
docker exec stack-parity-composer-check bun -e "const r = await fetch('http://127.0.0.1:3000/health'); console.log(r.status, await r.text()); if (!r.ok) process.exit(1)"
```

Expected HTTP status 200 and `{"status":"ok","contractVersion":"spike-001"}`. Record the exact response and the `dev: ready` service name/port. End the first command with Ctrl+C. A container exits and is removed by `--rm`. Do **not** authenticate or deploy as part of this local check.

This validation is intentionally separate from Docker standalone `/health`. It is **not yet executed** and does not change the acceptance boundary.

## Composer dev second attempt — Alchemy optional peer failure (2026-10-12)

The user pulled commit `acf636a`, and `docker compose run --rm dev pnpm build` **succeeded**:

```text
@stack-parity/public-api:build: Bundled 161 modules in 57ms
Tasks: 1 successful, 1 total
```

`docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev` passed the earlier invalid-ID validation and printed:

```text
[dev] compute emulator ready at http://127.0.0.1:4300
Alchemy could not load the required peer dependency "@effect/platform-node".
Install a compatible version of "@effect/platform-node" in the same project as "alchemy".
[ELIFECYCLE] Command failed with exit code 1.
```

**Interpretation:** the underlying local compute emulator launched, but the Composer/Alchemy converge failed. This is not a passing Composer local runtime gate, and port 4300 is **not** an independently verified public API endpoint. The Prisma agent skill sync message is a separate advisory.

**Verified dependency evidence:** committed `pnpm-lock.yaml` already contains `@effect/platform-node@4.0.0-rc.115` and `@effect/platform-bun@4.0.0-rc.115` as transitive dependencies, but root `package.json` previously declared neither directly. Prisma Composer's own dogfooding notes document the Alchemy CLI's practical runtime requirement for both packages despite optional peer dependency metadata. This is consistent with a pnpm isolated-dependency resolution problem; it is not proof that no other problem remains.

**Minimal fix committed:** declare those exact versions in root `devDependencies`. No new framework, service, Docker image, Postgres, or general Effect override was introduced.

**Critical:** the committed lockfile has not yet been regenerated after the manifest change. Do **not** attempt `--frozen-lockfile` until pnpm regenerates and commits it. On the existing Docker volumes, run:

```powershell
git pull --ff-only
docker compose run --rm dev pnpm install --reporter=append-only
$LASTEXITCODE
```

Only if exit code is `0`, commit the pnpm-generated lockfile from the working tree:

```powershell
git add pnpm-lock.yaml
git commit -m "chore(spike-001): lock explicit Alchemy platform peers"
git push origin spike/compute-monorepo-foundation
```

Then rerun the **same Composer gate** without changing infrastructure:

```powershell
docker compose run --rm dev pnpm build
docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev
```

If Composer reaches `dev: ready`, verify the printed service port from inside that exact container as instructed in the prior gate. Preserve any failure output for a targeted correction. Cloud authentication/deployment remain out of this retest.

## Composer dev third attempt — Effect package version conflict (2026-10-12)

After adding direct `@effect/platform-node@4.0.0-rc.115` and `@effect/platform-bun@4.0.0-rc.115`, the user reran `docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev` and observed:

```text
[CLI.CONFIG_UNREADABLE] /workspace/prisma.config.ts could not be evaluated:
Cannot find module
'/workspace/node_modules/.pnpm/@effect+platform-node@4.0.0-rc.115_effect@4.0.3_redis@6.3.0/node_modules/effect/dist/unstable/http/Cookies.js'
[ELIFECYCLE] Command failed with exit code 2.
```

**Root cause backed by the path:** `@effect/platform-node` `4.0.0-rc.115` was paired with `effect` `4.0.3` during the new install. The previous committed lockfile had Composer `0.25.0` pinned to `effect` `4.0.0-rc.115`, but peer resolution changed when direct platform packages were added. The stale lockfile does not describe this new dependency tree.

**Prisma's official deployment documentation confirms** that `CLI.CONFIG_UNREADABLE` with missing `effect/dist/...` modules can arise from Effect version mismatches, and states that pnpm 11 reads `overrides` from `pnpm-workspace.yaml` (not the `pnpm` field of package.json).

**Narrow corrective change:** preserve the existing Composer and Prisma versions, and pin `effect` to `4.0.0-rc.115` in `pnpm-workspace.yaml`; additionally align only the Effect-family transitive packages found at both `rc.115` and `4.0.3` in the previous committed lockfile: `@effect/platform-node-shared`, `@effect/sql-d1`, `@effect/sql-sqlite-do` and `@effect/vitest`. `@effect/platform-node` and `@effect/platform-bun` were already explicitly pinned at `rc.115`. No Docker architecture change, broad dependency upgrade or new product scope.

**This is a hypothesis-driven fix awaiting user execution, not a successful runtime result.** Reinstall normally so pnpm can update `pnpm-lock.yaml`. Do NOT run frozen-lockfile mode until it has been regenerated, verified and committed.

```powershell
git pull --ff-only
docker compose run --rm dev pnpm install --reporter=append-only
$LASTEXITCODE
```

If the installer exits `0`, check the package resolution and retry the Composer gate:

```powershell
docker compose run --rm dev pnpm build
docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev
```

If the error persists, capture the actual new path and exit code before adjusting any further packages. If local Composer succeeds, verify the service port and record the matching HTTP contract response. Once the dependency graph is working, commit the pnpm-generated lockfile on this branch and verify `pnpm install --frozen-lockfile`.

The `prisma skills sync` advisory is unrelated to the Effect runtime mismatch. No cloud authentication or deploy should be performed until local Composer is verified.

## Composer local fourth attempt — CLI/Core API incompatibility (2026-10-12)

User's local Windows checkout was successfully advanced to `cf94eb1` after stashing a local `minimumReleaseAgeExclude: effect@4.0.3` workspace change. A separate, locally modified `pnpm-lock.yaml` remained uncommitted. The user reported `pnpm install` exit `0`, a successful cache-miss Bun build, and `compute:dev` reaching the emulator before Alchemy failed:

```text
[dev] compute emulator ready at http://127.0.0.1:4300
SyntaxError: The requested module '@prisma/composer/local-target' does not
provide an export named 'devState'
import { DEV_DIR, devState, localTargetProviders, resolveLocalTargets } from
'@prisma/composer/local-target';
[ELIFECYCLE] Command failed with exit code 1.
```

The `prisma skills sync` message and newer Alchemy update notice are **not** the cause of the error. Do not upgrade Alchemy independently.

**Confirmed cause from official version-controlled source (not inferred from the error alone):**
- The installed Prisma CLI is `prisma@8.0.0-rc.22`. Upstream `prisma/prisma-cli` tag `v8.0.0-rc.22` explicitly declares `@prisma/composer-cli: 0.29.1` in `packages/prisma/package.json`.
- The application pinned `@prisma/composer: 0.25.0` and `@prisma/composer-prisma-cloud: 0.25.0`.
- Upstream `prisma/composer` `v0.25.0` `packages/0-framework/1-core/core/src/exports/local-target.ts` exports `localTargetProviders` and `resolveLocalTargets` but **not** `devState`.
- Upstream `prisma/composer` `v0.29.1` exports **`devState`** from the same entry.
- `@prisma/composer-prisma-cloud@0.29.1` declares its `@prisma/composer` dependency at `0.29.1` and retains the Effect `4.0.0-rc.115` family currently pinned by the project.

**Targeted patch:** root `package.json` now pins `@prisma/composer` and `@prisma/composer-prisma-cloud` to `0.29.1`. Prisma CLI `8.0.0-rc.22`, Hono, Docker, dependency-script security policy and existing Effect pins remain unchanged. This is a release-coherence fix, not a blanket upgrade.

**Next local commands** (do not overwrite the user's uncommitted lockfile or pop the saved stash):

```powershell
git status --short
git pull --ff-only
docker compose run --rm dev pnpm install --reporter=append-only
$LASTEXITCODE
```

On successful install, rerun typecheck, test and build; then launch `pnpm compute:dev` and record the actual output. Regenerate and commit the pnpm-owned lockfile only after checking install/test results; verify `--frozen-lockfile` against the committed version. If a new error occurs, preserve it without broadening architecture or claiming Composer has passed. The local Compose `dev` Hono server is a separate smoke test, not the Composer runtime.

## Standalone Docker HTTP visual evidence (2026-10-12)

The user supplied a screenshot of `http://localhost:3000/health` in a desktop browser. It visibly renders:

```json
{"status":"ok","contractVersion":"spike-001"}
```

This confirms the expected **response body** was served by the standalone Docker Hono process. The screenshot does not display the HTTP response status code, so a `curl.exe -i` result would be needed to record an explicit `HTTP 200` assertion. The route `/` returning `404 Not Found` is expected because only `/health` is defined; no new root route is required.

**Scope boundary:** standalone `localhost:3000` is not Prisma Composer's provisioned runtime and is not a public Prisma Compute deployment. The latest Composer version-alignment patch changed `@prisma/composer` and `@prisma/composer-prisma-cloud` to `0.29.1`; no user-run Composer retest after that patch has yet been provided. The locally modified `pnpm-lock.yaml` should be regenerated with pnpm and committed after the updated install checks pass.

## Composer dev startup success (user log, 2026-10-12)

Following release alignment to `@prisma/composer@0.29.1` and `@prisma/composer-prisma-cloud@0.29.1`, the user supplied the following successful **local Composer startup** result:

```text
$ prisma dev module.ts
[dev] compute emulator ready at http://127.0.0.1:4300
✓ Plan ready (1.2s)
Plan · 4 no change
✓ COMPOSER_PUBLICAPI_ORIGIN-var (Prisma.EnvironmentVariable) no change
✓ COMPOSER_PUBLICAPI_PORT-var (Prisma.EnvironmentVariable) no change
✓ publicApi-deploy (Prisma.Deployment) no change
✓ publicApi-svc (Prisma.App) no change
Stack deployed
dev: ready
```

No Alchemy export error, Effect version error or Composer graph error occurred. The `alchemy 2.0.0-beta.81 is available` notice is informational, not a reason to upgrade or modify the dependency tree. The phrase `Plan · 4 no change` is a **warm-state no-op**, not evidence that a fresh cloud deployment happened.

**Precisely verified:** Composer/Alchemy local converge reached `dev: ready`. **Still not verified:** Composer-managed `publicApi` HTTP request and status, or any **remote** Prisma Compute deployment.

The existing standalone Hono container already binds Windows `localhost:3000`. To avoid testing that process by mistake, probe from **inside the named Composer container** with the local default service port `3000` (the Composer docs state this as the default). With the original `docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev` process still running, use a **second PowerShell terminal**:

```powershell
docker exec stack-parity-composer-check node -e "fetch('http://127.0.0.1:3000/health').then(async r => { console.log('HTTP', r.status); console.log(await r.text()); process.exit(r.status === 200 ? 0 : 1) }).catch(e => { console.error(e.message); process.exit(1) })"
$LASTEXITCODE
```

Expected `HTTP 200` and `{"status":"ok","contractVersion":"spike-001"}`. If the port is different or a connection fails, inspect Composer's actual exposed service port and runtime logs rather than presuming the Hono standalone check covers it. The emulator control port `4300` is not automatically the app's HTTP port.

The `pnpm-lock.yaml` committed in GitHub still records Composer `0.25.0`, so it is outdated after the patch. The user's locally regenerated lockfile needs review/commit, followed by frozen-lockfile validation; do not attempt a remote deploy before closing the local gate.

## Acceptance evidence

| Gate | Status | Evidence |
|---|---|---|
| AC-01 clean install + committed lockfile | USER-REPORTED PASS / RAW LOG PENDING | Lockfile committed at 2395318; user indicates frozen install was successful; exact exit code not captured |
| AC-02 workspace package import | CODE PREPARED | Runtime/bundle not verified |
| AC-03 typecheck + build | USER-REPORTED PASS | Typecheck, unit test and build each returned exit code 0 on Windows Docker; full logs not captured |
| AC-04 local /health | BODY VERIFIED / STATUS PENDING / COMPOSER PENDING | Browser screenshot shows expected JSON at localhost:3000/health; HTTP status header and Composer-managed run not yet captured |
| AC-05 Composer declaration | USER-REPORTED LOCAL STARTUP PASS | After Composer 0.29.1 alignment, log shows Plan ready, 4 no change, Stack deployed, dev: ready; HTTP and fresh cloud deploy remain separate |
| AC-06 successful remote deployment | NOT RUN | Requires interactive Prisma auth |
| AC-07 public /health HTTP 200 | NOT RUN | Requires deployment URL |
| AC-08 evidence | PARTIAL | Missing run logs and versions |

## Stop conditions

- Do not merge until clean install, lockfile, build and local tests are verified.
- Do not close Issue #1 or promote Product domain before remote HTTP 200 is observed.
- If a Composer version mismatch occurs, document it and make the **smallest** build/configuration fix. Do not add frameworks or platform adapters.
