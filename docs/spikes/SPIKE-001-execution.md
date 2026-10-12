# SPIKE-001 Execution & Evidence

**Status: IN PROGRESS — install/rebuild/typecheck/unit tests/build reported successful; local HTTP and deployment pending**
**Issue:** #1
**Branch:** `spike/compute-monorepo-foundation`

## Environment

The branch was prepared without access to a compatible local Node/Bun/pnpm package installation environment. The user's initial Docker installation was interrupted, but after fixing the pnpm 11 lifecycle script policy, the user confirmed exit code `0` for both `pnpm install --reporter=append-only` and `pnpm rebuild esbuild workerd` (2026-10-12). A lockfile has **not been verified or committed**. The user also reported exit code `0` for typecheck, unit tests, and build. No successful local HTTP check, Composer run, or cloud deployment has been established.

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

This validates the immediate installer/rebuild blocker **as user-reported execution evidence**. It does not establish a clean frozen-lockfile install, correct runtime behavior, or any Prisma Compute deployment. The lockfile is still absent from the GitHub branch and must be committed after verification. The user subsequently reported exit code `0` for `pnpm typecheck`, `pnpm test`, and `pnpm build` inside the Docker toolchain. The next gate is the standalone Docker HTTP check. Full command output is not attached, so the result is marked user-reported.

## User-reported validation (2026-10-12)

The user confirms exit code `0` for each of:

```powershell
docker compose run --rm dev pnpm typecheck
docker compose run --rm dev pnpm test
docker compose run --rm dev pnpm build
```

This is **user-reported exit-code evidence**, not an independently captured test log. It supports moving to a standalone Docker HTTP smoke check without marking the entire SPIKE-001 PASS.

## Acceptance evidence

| Gate | Status | Evidence |
|---|---|---|
| AC-01 clean install + committed lockfile | PARTIAL | User reports install+rebuild exit code 0 after allowBuilds; committed lockfile and frozen reinstallation pending |
| AC-02 workspace package import | CODE PREPARED | Runtime/bundle not verified |
| AC-03 typecheck + build | USER-REPORTED PASS | Typecheck, unit test and build each returned exit code 0 on Windows Docker; full logs not captured |
| AC-04 local /health | NOT RUN | Next: persistent Hono container and HTTP 200; Composer dev still separate |
| AC-05 Composer declaration | PREPARED | Requires installed-version validation |
| AC-06 successful remote deployment | NOT RUN | Requires interactive Prisma auth |
| AC-07 public /health HTTP 200 | NOT RUN | Requires deployment URL |
| AC-08 evidence | PARTIAL | Missing run logs and versions |

## Stop conditions

- Do not merge until clean install, lockfile, build and local tests are verified.
- Do not close Issue #1 or promote Product domain before remote HTTP 200 is observed.
- If a Composer version mismatch occurs, document it and make the **smallest** build/configuration fix. Do not add frameworks or platform adapters.
