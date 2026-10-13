# SPIKE-001 Execution & Evidence

**Status: SPIKE-001 TECHNICAL ACCEPTANCE PASS — local checks, Composer, isolated Prisma Compute deployment, and external HTTP 200 verified; PR merge review pending**
**Issue:** #1
**Branch:** `spike/compute-monorepo-foundation`

## Environment

The original Docker install and Composer launch encountered configuration and dependency problems; the chronological investigation and failed attempts below are preserved as historical evidence. **All final local and remote acceptance gates have since passed (2026-10-13)**. Refer to the final acceptance table and external HTTP proof at the end of this document rather than treating interim BLOCKED/PENDING observations as current.

Verified toolchain and pinned dependencies: Docker dev image `node:24-bookworm-slim` (Node 24), Bun `1.4.3`, pnpm `11.28.5`, Turborepo `2.11.2`, Prisma CLI `8.0.0-rc.22`, `@prisma/composer@0.29.1`, `@prisma/composer-prisma-cloud@0.29.1`. The final lockfile was committed as `041b120ace603be1c1ad3336508546e12788f42b`; frozen installation, typecheck, Bun test, forced uncached build, local Composer HTTP, and remote public HTTP all passed on user-executed commands.

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

The existing standalone Hono container already binds Windows `localhost:3000`. To avoid testing that process by mistake, inspect the Composer container's actual service listener and test from inside the named container. The prior guess of port `3000` was not confirmed for this process. With the original `docker compose run --rm --name stack-parity-composer-check dev pnpm compute:dev` process still running, use a **second PowerShell terminal**:

```powershell
docker exec stack-parity-composer-check node -e "fetch('http://127.0.0.1:3000/health').then(async r => { console.log('HTTP', r.status); console.log(await r.text()); process.exit(r.status === 200 ? 0 : 1) }).catch(e => { console.error(e.message); process.exit(1) })"
$LASTEXITCODE
```

Expected `HTTP 200` and `{"status":"ok","contractVersion":"spike-001"}`. If the port is different or a connection fails, inspect Composer's actual exposed service port and runtime logs rather than presuming the Hono standalone check covers it. The emulator control port `4300` is not automatically the app's HTTP port.

The `pnpm-lock.yaml` committed in GitHub still records Composer `0.25.0`, so it is outdated after the patch. The user's locally regenerated lockfile needs review/commit, followed by frozen-lockfile validation; do not attempt a remote deploy before closing the local gate.

## Composer local HTTP probe failure (user log, 2026-10-12)

The user reports `docker exec stack-parity-composer-check node -e "fetch('http://127.0.0.1:3000/health')..."` yielded `fetch failed` with exit code `1`. This is an **unverified Composer-managed HTTP gate**, despite `Stack deployed` and `dev: ready`. The standalone Hono Docker HTTP test is separate.

**Port correction:** `service.port()` defaults to 3000 in the Composer quickstart, but local-dev docs say `prisma dev` prints each service's actual local URL. The user's readiness output omitted any `publicApi` URL. `Plan · 4 no change` is a warm-state converge, and does not by itself prove the service is listening. The documentation discusses a possible stale-emulator situation with readiness but missing endpoints, yet this has **not** been proven in this instance.

**Read-only next diagnostics:** `docker ps --filter "name=stack-parity-composer-check"`, `docker top stack-parity-composer-check`, and inspect TCP LISTEN entries from `/proc/net/tcp` and `/proc/net/tcp6` inside that same container. Check for a Bun server process and the actual exposed port before any targeted retry or state recovery. Do not run `--fresh`, clear volumes or change Docker port mappings without evidence. Do not claim a public or local HTTP PASS.

## Composer container listener diagnosis (user log, 2026-10-12)

The user inspected the **running** `stack-parity-composer-check` container after the failed internal HTTP fetch.

```text
docker ps: stack-parity-composer-check Up 4 minutes (unhealthy)
docker top: docker-init, pnpm compute:dev, prisma dev module.ts,
            esbuild --service, .../composer-prisma-cloud/dist/compute-main.mjs --port 4300
TCP LISTEN ports: 44189, 4300
```

No Bun/Hono server process appears in `docker top`, and **port 3000 is not listening in the Composer container**. The `unhealthy` Docker state is explained by the Compose healthcheck hardcoded to standalone `127.0.0.1:3000/health`, not a direct signal that `prisma dev` failed. Port 4300 belongs to the Compute emulator; port 44189 is unidentified from the current evidence. Do not present either as a service HTTP URL without proof.

The preceding `prisma dev` log says `Plan · 4 no change`, `Stack deployed`, `dev: ready`, but does not list `publicApi: http://localhost:...` as Prisma's [local development guide](https://www.prisma.io/docs/composer/local-development) describes. That guide explicitly documents a **warm-state inconsistency where `dev` reports ready but no services are listed after emulators restart underneath a project**.

**Likely but not yet confirmed mechanism:** this project uses `docker compose run --rm` (short-lived, new containers) while Alchemy/.prisma-composer project state under the repository bind mount persists; the emulator daemon shown in this run is new, but persisted state can report `no change` without provisioning a new service process. A clean local Composer state is an evidence-backed recovery candidate, **not a confirmed fix**.

The upstream guide supports `prisma dev module.ts --fresh` for an app **without databases** (it notes limitations for apps with databases). This spike provisions one Hono service and zero databases. However, `--fresh` deliberately wipes the **local app's emulator instances and data**; do not run without treating this as a bounded reset and giving the user an opportunity to preserve any local data. No Docker volumes or unrelated workspace files should be deleted. Do not deploy remotely or close the issue before Composer-managed HTTP 200 is obtained.

## Local Composer recovery — `--fresh` (user log, 2026-10-12)

The user stopped the previous Composer process, saved a timestamped backup of any project-local `.alchemy` and `.prisma-composer` directories at `E:\\projects\\stack-parity-local-state-20261012-145639`, and ran:

```powershell
docker compose run --rm --name stack-parity-composer-check dev pnpm exec prisma dev module.ts --fresh
```

User-provided output:

```text
[dev] compute emulator ready at http://127.0.0.1:4300
✓ Plan ready (1.1s)
Plan · 4 created
✓ COMPOSER_PUBLICAPI_ORIGIN-var (Prisma.EnvironmentVariable) created
✓ COMPOSER_PUBLICAPI_PORT-var (Prisma.EnvironmentVariable) created
✓ publicApi-deploy (Prisma.Deployment) created
✓ publicApi-svc (Prisma.App) created
Stack deployed (4/4)
dev: ready
publicApi: http://localhost:3000
```

**Result:** A clean local Composer converge now creates four resources and advertises `publicApi` at port 3000. This is strong evidence that the previous persistent local state was responsible for the `4 no change`/missing service URL, but does not by itself establish the precise stale-state mechanism.

**Next gate, not yet observed:** While the `--fresh` command remains running, make the HTTP request **inside the same named container**, not from the host's unrelated standalone Hono service:

```powershell
docker exec stack-parity-composer-check node -e "fetch('http://127.0.0.1:3000/health').then(async r => { console.log('HTTP', r.status); console.log(await r.text()); process.exit(r.status === 200 ? 0 : 1) }).catch(e => { console.error(e.message); process.exit(1) })"
$LASTEXITCODE
```

Require `HTTP 200`, `{"status":"ok","contractVersion":"spike-001"}`, and exit code 0 before marking the Composer-managed HTTP gate PASS.

**Outstanding independent blockers:** The GitHub-committed `pnpm-lock.yaml` still lists Composer `0.25.0`; the package manifests now require `0.29.1`. The pnpm-generated lockfile needs review and commit, followed by frozen-lockfile test. Real remote Prisma Compute deployment and public HTTP 200 are pending. Do not merge PR #3, close Issue #1, or add new product scope yet.

## Composer-managed HTTP gate PASSED (user execution, 2026-10-12)

After `pnpm exec prisma dev module.ts --fresh` printed `Stack deployed (4/4)`, `dev: ready` and `publicApi: http://localhost:3000`, the user executed the request **inside the named Compose one-off container** `stack-parity-composer-check`, not against the independent host-exposed standalone Hono process.

Exact user-reported result:

```text
HTTP 200
{"status":"ok","contractVersion":"spike-001"}
0
```

**This passes the local Composer-managed HTTP contract assertion.** The returned `contractVersion` is defined in the shared `@stack-parity/contracts` workspace package. This does **not** imply Prisma Cloud deployment or external public reachability.

GitHub state checked after this gate: `package.json` pins Composer `0.29.1`, but the committed `pnpm-lock.yaml` importers still pin Composer `0.25.0`. The user has a locally regenerated lockfile from successful pnpm installation. Verify `pnpm install --frozen-lockfile` **in the user's local checkout**, inspect that only the intended lockfile was staged, then commit/push it. Re-run typecheck/test/build against the frozen set to close reproducibility evidence. Hold remote deployment until the lockfile is consistent and those tests pass.

## Frozen-lockfile local gate (user report, 2026-10-12)

After the Composer-managed `/health` request succeeded, the user executed the previously supplied `docker compose run --rm dev pnpm install --frozen-lockfile` and reported exit code **0**. This confirms the **current local working-tree lockfile** is coherent with the manifest for pnpm 11 and installs successfully in the Docker development image. Full install log not provided.

This is a **local workspace PASS only**. At the time of verification the `pnpm-lock.yaml` committed on GitHub still pins Composer `0.25.0`; the manifest pins Composer `0.29.1`. The regenerated lockfile must be staged, reviewed, committed and pushed to make frozen installs reproducible from GitHub. Next gate: rerun `pnpm typecheck`, `pnpm test`, `pnpm build` against the frozen installation, then commit/push **only** the regenerated lockfile once all commands pass. Do not restore the earlier workspace-config stash or modify dependencies.

## Local acceptance gate closed — committed lockfile and quality checks (2026-10-12)

The user supplied Windows PowerShell output after the Composer-managed HTTP 200:

- `docker compose run --rm dev pnpm install --frozen-lockfile` — `Already up to date`, exit `0`.
- `docker compose run --rm dev pnpm typecheck` — TypeScript `tsc -p tsconfig.json --noEmit`, exit `0`.
- `docker compose run --rm dev pnpm test` — Bun v1.4.3, `1 pass / 0 fail`, exit `0`.
- `docker compose run --rm dev pnpm build` — Turborepo 2.11.2, `1 successful / 1 total`, `1 cached`, exit `0`. The build gate passed by replaying a cached successful artifact; this does **not** establish an uncached build on the final lockfile.
- `git diff --check -- pnpm-lock.yaml` produced no whitespace errors; `git status --short` showed only `M pnpm-lock.yaml`. The Windows LF→CRLF warning did not constitute a validation failure.
- GitHub PR #3 head `041b120ace603be1c1ad3336508546e12788f42b` now contains the user's `chore(spike-001): lock verified Composer 0.29.1 dependencies` commit, changing **only `pnpm-lock.yaml`**. The committed lockfile importer now pins `@prisma/composer@0.29.1` and `@prisma/composer-prisma-cloud@0.29.1`, matching `package.json`.

**Scope of the PASS:** consistent committed dependency graph, typecheck, unit test, cached successful build, Composer local converge and Composer-managed `GET /health` HTTP 200 / `contractVersion: spike-001` — as evidenced by the user's executed commands. One optional tightening is an uncached build, but no reason to introduce new infrastructure/CI for it.

**Next gate:** official `prisma/composer` v0.29.1 deployment documentation confirms `prisma deploy module.ts` targets **production** by default, whereas `prisma deploy module.ts --stage spike-001` targets an isolated stage. The current Composer configuration fixes the Compute region to `eu-central-1`. Remote execution requires the user's explicitly authorized Prisma Cloud workspace/credentials (interactive `prisma auth login` or the documented service token). The existing `docker compose run --rm` creates ephemeral containers; do not assume an interactive session saved there persists to a subsequent one-off container. Avoid publishing token values or accidentally deploying to production.

**No remote deploy was executed in this session.** Until a public deployment URL returns HTTP 200 and matching JSON, retain PR Draft / Issue #1 open and do not advance beyond B0 SPIKE-001.

## Prisma Cloud interactive login — authenticated CLI session (user screenshot, 2026-10-13)

The user resolved the earlier Docker-to-host browser callback failure and supplied a Prisma CLI screenshot with:

```text
Sign in via your browser
Starting an authenticated CLI session.
status: signed in
workspace: Personal workspace
```

**Result:** interactive login completed and the Prisma CLI reported a signed-in session for `Personal workspace`. The screenshot also displayed a user email, deliberately **omitted from this repository**. The later `Prisma agent skills are out of date` advisory is informational and does not establish an authentication or deployment failure.

**Still required before any cloud write:** run `pnpm exec prisma auth whoami` **in the same running authenticated Docker shell** to verify which workspace is active; verify the local `services/public-api/dist/server.mjs` exists and matches the built application. The user must explicitly authorize a potentially billable, isolated `spike-001` stage in region `eu-central-1`. Do **not** run an unqualified `prisma deploy module.ts`: per upstream Composer v0.29.1 docs it targets production. Do not store tokens, verification links, authorization codes or credential values in git or chat.

**Current remote status:** authentication login succeeded; project deployment **not executed** and no public URL or HTTP 200 yet. Keep PR #3 Draft and Issue #1 open.

## Cloud deploy preflight — identity and artifact verified (user screenshot, 2026-10-13)

The user ran both commands from the authenticated Prisma CLI container shell:

```sh
pnpm exec prisma auth whoami
test -s services/public-api/dist/server.mjs && echo "build artifact: OK"
```

Observed result (private account email intentionally excluded from evidence):

```text
status: signed in
workspace: Personal workspace
build artifact: OK
```

**Preflight PASS:** an authenticated CLI session is active in the Docker shell for the `Personal workspace`, and the Hono build artifact file is present and nonempty. The file presence check does **not** prove freshness of the bundled output; rerun `pnpm exec turbo run build --force` inside the same shell before any remote deployment to avoid relying solely on a cached build.

**Cost information (official Prisma Compute pricing, checked 2026-10-13):** Free has no usage billing with included monthly requests, memory, CPU and bandwidth; paid plans meter compute usage. Deployments and stage creation are not billed on their own. The screenshot does not identify the workspace's active plan, quotas, or current utilization, so actual cost/eligibility is not confirmed. See https://www.prisma.io/pricing and https://www.prisma.io/docs/compute/pricing.

**Human approval required before cloud write:** confirm isolated stage `spike-001` in configured region `eu-central-1`, within the authenticated `Personal workspace`. Exact intended command after approval and build: `pnpm exec prisma deploy module.ts --stage spike-001` (unqualified `prisma deploy module.ts` would target production). Preserve the authenticated shell until deployment. Do not include credentials, browser verification links or tokens in logs or committed docs.

**AC-06 remains PENDING:** no real cloud deploy was executed; no public service URL or HTTP 200 evidence yet.

## Uncached build and staged deploy preflight failure (user CLI, 2026-10-13)

The user ran the following in the authenticated Docker development shell (workspace: `Personal workspace`):

```sh
pnpm exec turbo run build --force
pnpm exec prisma deploy module.ts --stage spike-001
```

The forced build **PASS** result is user-confirmed:

```text
@stack-parity/public-api:build: cache bypass, force executing
@stack-parity/public-api:build: Bundled 161 modules in 55ms
Tasks: 1 successful, 1 total
Cached: 0 cached, 1 total
```

The **cloud deployment did not complete**. Prisma CLI stopped during preflight:

```text
Load config and app
X load config and app (3ms)
[DEPLOY.STAGE_UNVALIDATABLE] git is required to validate --stage "spike-001" (git check-ref-format): spawnSync git ENOENT.
```

**Confirmed cause:** `Dockerfile.dev` uses `node:24-bookworm-slim` and did not install `git`. Prisma validates stage names by launching the `git` executable, which is missing from the running Linux container; the Windows host Git is not available inside it. This is not a Hono, Bun build, Prisma credentials or stage-name syntax error. The run did not get past `load config and app`; there is no evidence of a created cloud deployment or public URL. The Prisma skills update notice is informational.

**Narrow permanent correction:** install Git with `apt-get install -y --no-install-recommends git` in the development-only `Dockerfile.dev`. No project services, dependencies, workspace config, application code or deployment target changed. The new image is **not yet Docker-built or user-verified**.

**Preserve authentication for immediate retry:** do **not** replace the authenticated one-off container mid-session. From a separate PowerShell window, inspect `docker ps --filter name=stack-parity-cloud-check`. If that named container still exists, use `docker exec --user root stack-parity-cloud-check sh -lc "apt-get update && apt-get install -y --no-install-recommends git && git --version"`, then in the **original authenticated shell** run `git check-ref-format --branch spike-001`. Root installation is ephemeral in that running container and avoids loss of the Prisma login. The permanent `Dockerfile.dev` change applies to **future containers after a deliberate `docker compose build dev`**, which should occur after the authenticated session is no longer needed. Neither install nor validation is a cloud write.

With Git verified, rerun only the previously attempted and user-authorized isolated stage command `pnpm exec prisma deploy module.ts --stage spike-001`, **never omit `--stage`**, and capture results. Public `GET /health` HTTP 200 remains mandatory before SPIKE-001 can be marked PASS.

## First successful remote Prisma Compute deployment (user log, 2026-10-13)

Following the Docker Git prerequisite fix, the user ran:

```sh
pnpm exec prisma deploy module.ts --stage spike-001
```

Authenticated Prisma Cloud workspace: `Personal workspace`. Root Composer config selects `prismaCloud({ region: "eu-central-1" })`. The `--stage spike-001` option explicitly selects a **non-production** environment.

The user supplied CLI evidence:

```text
✓ load config and app
✓ assemble services / publicApi
✓ connect to project and branch
✓ check environment variables
✓ Plan ready (7.2s)
stack-parity
└─ publicApi   compute-service
   https://xleysf70okhj533gk5sbm6qp.fra.prisma.build
Plan · 4 created · 1 ran
✓ COMPOSER_PUBLICAPI_ORIGIN-var created
✓ COMPOSER_PUBLICAPI_PORT-var created
✓ publicApi-deploy created
✓ publicApi-svc created
✓ composer-deployment-report ran
Stack deployed (5/5)
publicApi: https://xleysf70okhj533gk5sbm6qp.fra.prisma.build
✓ Deployed stack-parity to spike-001 in 22.0s.
```

**AC-06 PASS:** the CLI completed a **real remote Prisma Compute stage deployment**, with a public endpoint assigned. The deployed service base URL is `https://xleysf70okhj533gk5sbm6qp.fra.prisma.build`.

**AC-07 still PENDING:** no HTTP status/response body evidence was supplied by the user for the public endpoint. An independent HTTP fetch from the assistant execution environment could not resolve the external DNS; this does **not** constitute HTTP failure by the deployed service. Request from the user's Windows PowerShell terminal:

```powershell
curl.exe -i --max-time 20 "https://xleysf70okhj533gk5sbm6qp.fra.prisma.build/health"
$LASTEXITCODE
```

Require an actual `HTTP/2 200` or `HTTP/1.1 200` and `{"status":"ok","contractVersion":"spike-001"}` with exit code `0`.

**Non-blocking warnings observed:** the Composer CLI printed `Not recording this deploy in Prisma Cloud: /workspace has no commit and branch to report it under. Deploy from a git checkout to see it in the Console.` This is a deployment **commit/branch provenance metadata gap**, not a rollback or deployment failure. The Docker container's `/workspace` lacked usable Git checkout metadata for reporting; address only if justified after the public-HTTP gate, without changing the scope or fabricating recorded provenance. Alchemy update and Prisma skills advisories are informational.

Do **not** treat the live service as a completed SPIKE until the public HTTP gate is proved and recorded. Keep Issue #1 open and PR #3 Draft pending final acceptance decision. The isolated stage is an actual persistent resource; track its later teardown/retention separately from success verification to avoid unexpected usage.

## Final external public HTTP proof (2026-10-13) — AC-07 PASS

Windows PowerShell, **outside the Docker container and Prisma Cloud**, executed the real public HTTPS request to the `publicApi` service:

```powershell
curl.exe -i --max-time 20 "https://xleysf70okhj533gk5sbm6qp.fra.prisma.build/health"
$LASTEXITCODE
```

Exact result supplied by the user:

```http
HTTP/1.1 200 OK
Content-Length: 45
Content-Type: application/json
Date: Tue, 13 Oct 2026 10:15:25 GMT
Prisma-Request-Id: 01M4TC51817WF31PGNDXRV0BNK
X-Request-Id: 01M4TC51817WF31PGNDXRV0BNK

{"status":"ok","contractVersion":"spike-001"}
```

The PowerShell `$LASTEXITCODE` value was **`0`**. This proves external HTTP reachability (status 200), JSON response, and exact shared-contract version **on the real deployed Compute stage**. **AC-07 PASS**.

**Final SPIKE-001 technical verdict: PASS — AC-01 through AC-08 substantiated** by committed configuration, user's Docker/Prisma CLI commands and HTTP output. AC-08 captures versions, stage/region, real public URL, command outputs, and important warnings without credentials. This pass is **technical feasibility**, not a security review or production-readiness guarantee. The external URL was verified by the user, not independently re-probed by the assistant.

**Warnings and follow-up controls (non-blocking for SPIKE-001):**
- Prisma Cloud reported no deploy commit/branch metadata: `/workspace has no commit and branch to report it under`. This is a **provenance/reporting limitation**, not a deployment or HTTP failure. Do not claim that Prisma Console captured Git revision metadata.
- The tested target is an isolated `spike-001` stage in the workspace used by the signed-in user, with `prismaCloud({ region: "eu-central-1" })` in project configuration. **Production was not targeted.**
- `alchemy` and `prisma skills sync` update notices did not prevent deploy. Updating those tools is outside B0 scope.
- The deployed stage remains a **real potentially metered cloud resource**. Decide whether to retain it temporarily for review or explicitly approve a documented stage teardown later; do not delete automatically.
- The newly committed `Dockerfile.dev` Git installation and Docker image rebuild have not been independently retested as a brand-new image; the running authenticated container was patched with Git during the spike. This nuance does not invalidate the observed remote deployment and external HTTP proof.
- B0 PR #3 remains **Draft until final review and explicit merge decision**; avoid starting the Product milestone automatically.

## Acceptance evidence

| Gate | Status | Evidence |
|---|---|---|
| AC-01 clean install + committed lockfile | PASS (user-run + GitHub verified) | Frozen install exit 0; head 041b120 committed pnpm-lock.yaml importer Composer 0.29.1 and Cloud extension 0.29.1, matching manifest |
| AC-02 workspace package import | USER-EXECUTED RUNTIME PASS | Composer-managed HTTP response contains shared workspace contractVersion spike-001; import is explicit in Hono source |
| AC-03 typecheck + build | PASS (user-run, uncached build) | Typecheck exit 0; Bun test 1 pass/0 fail; Turbo --force: 1 successful, 0 cached, bundled 161 modules |
| AC-04 local /health | USER-EXECUTED PASS | In named Composer container: HTTP 200 and expected JSON, exit code 0; separate standalone Hono browser smoke also passed |
| AC-05 Composer declaration | USER-EXECUTED LOCAL PASS | --fresh created 4/4, dev: ready and publicApi URL; same Composer container returned HTTP 200 and contract JSON |
| AC-06 successful remote deployment | PASS (user-run Prisma CLI) | Prisma Cloud Personal workspace, stage spike-001; Stack deployed 5/5, 4 resources created and 1 report action, publicApi endpoint allocated; deploy finished in 22.0s |
| AC-07 public /health HTTP 200 | PASS (external Windows PowerShell) | curl.exe -i public /health: HTTP/1.1 200 OK, application/json, expected contractVersion spike-001; $LASTEXITCODE=0; Date 2026-10-13 10:15:25 GMT |
| AC-08 evidence | PASS (with non-blocking provenance note) | Node 24/Bun 1.4.3/pnpm 11.28.5/Composer 0.29.1/Prisma 8.0.0-rc.22, frozen install, uncached build, local/remote CLI output, stage, public HTTP proof and warnings documented; Cloud deploy Git metadata missing |

## Stop conditions

- Do not merge until clean install, lockfile, build and local tests are verified.
- Remote HTTP 200 has been observed; keep Issue #1 open until the final PR review/merge acceptance decision. Do not auto-promote the Product milestone.
- If a Composer version mismatch occurs, document it and make the **smallest** build/configuration fix. Do not add frameworks or platform adapters.
