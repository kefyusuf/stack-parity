# SPIKE-001 Execution & Evidence

**Status: BLOCKED — user Docker installation interrupted; fix prepared, retest required**
**Issue:** #1
**Branch:** `spike/compute-monorepo-foundation`

## Environment

The branch was prepared without access to a compatible local Node/Bun/pnpm package installation environment. A user attempted the Docker toolchain installation, but the install was interrupted before successful completion. A lockfile has **not been verified or committed**. No successful typecheck, build, unit test, local Composer run, or cloud deployment has been established.

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

## Acceptance evidence

| Gate | Status | Evidence |
|---|---|---|
| AC-01 clean install + committed lockfile | BLOCKED | User installation interrupted; retest with Docker volume fix |
| AC-02 workspace package import | CODE PREPARED | Runtime/bundle not verified |
| AC-03 typecheck + build | NOT RUN | Requires toolchain |
| AC-04 local /health | NOT RUN | Old Compose default did not start a server; retest standalone and separately Composer dev |
| AC-05 Composer declaration | PREPARED | Requires installed-version validation |
| AC-06 successful remote deployment | NOT RUN | Requires interactive Prisma auth |
| AC-07 public /health HTTP 200 | NOT RUN | Requires deployment URL |
| AC-08 evidence | PARTIAL | Missing run logs and versions |

## Stop conditions

- Do not merge until clean install, lockfile, build and local tests are verified.
- Do not close Issue #1 or promote Product domain before remote HTTP 200 is observed.
- If a Composer version mismatch occurs, document it and make the **smallest** build/configuration fix. Do not add frameworks or platform adapters.
