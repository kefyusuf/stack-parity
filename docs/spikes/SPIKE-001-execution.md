# SPIKE-001 Execution & Evidence

**Status: UNVERIFIED — DRAFT IMPLEMENTATION**
**Issue:** #1
**Branch:** `spike/compute-monorepo-foundation`

## Environment

The branch was prepared without access to a compatible local Node/Bun/pnpm package installation environment. No `pnpm-lock.yaml` has been generated or committed. No build, TypeScript check, unit test, local Composer run, or cloud deployment has been claimed.

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

## Acceptance evidence

| Gate | Status | Evidence |
|---|---|---|
| AC-01 clean install + committed lockfile | NOT RUN | Requires registry access |
| AC-02 workspace package import | CODE PREPARED | Runtime/bundle not verified |
| AC-03 typecheck + build | NOT RUN | Requires toolchain |
| AC-04 local /health | NOT RUN | Docker standalone check is additional evidence only; Composer dev still required |
| AC-05 Composer declaration | PREPARED | Requires installed-version validation |
| AC-06 successful remote deployment | NOT RUN | Requires interactive Prisma auth |
| AC-07 public /health HTTP 200 | NOT RUN | Requires deployment URL |
| AC-08 evidence | PARTIAL | Missing run logs and versions |

## Stop conditions

- Do not merge until clean install, lockfile, build and local tests are verified.
- Do not close Issue #1 or promote Product domain before remote HTTP 200 is observed.
- If a Composer version mismatch occurs, document it and make the **smallest** build/configuration fix. Do not add frameworks or platform adapters.
