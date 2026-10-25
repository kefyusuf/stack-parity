# B1 Phase B runtime probe fixtures

Reviewed, **not executed** fixtures for the B1-D Phase B compatibility probe. They are the source of truth for [the scratch preparation review](../../docs/milestones/B1-phase-b-scratch-preparation-20261025.md) and [the isolation plan](../../docs/milestones/B1-phase-b-isolation-plan.md). This directory is **not a product surface**: it is outside the pnpm workspace globs and the root `tsconfig.json` include list, so no build, typecheck or test reaches it.

## Contents

| File | Role |
| --- | --- |
| `compose.yaml` | `prepare` (networked materialization) + `runtime` (offline Composer launcher, `network_mode: none`, no published ports) |
| `prepare.sh` | scratch materialization: baseline extraction, explicit manifest additions, probe-owned lockfile install, offline contract emit, CLI-authored migrations |
| `manifest-additions.json` | the only dependency deltas: exact peer `@prisma/orm-postgres@8.0.0-rc.17` + `pg@8.22.0` |
| `prisma.config.ts` | baseline composer config + `orm` section (placeholder connection; URL injected at hydrate) |
| `probe/module.ts` | task-unique module identity `stack-parity-b1-runtime-20261025`; one Postgres resource + one read-only service |
| `probe/contract.prisma` | disposable `ProbeResult { id, name }` read-only table |
| `probe/contract.ts`, `probe/service.ts`, `probe/server.ts` | contract hydration, compute service, loopback-only read-only Bun handler (503 on failure, never fabricated data) |
| `validate-fixtures.sh` | review-time static assertions (55 checks) |
| `check-compose-boundaries.sh` | ownership-review assertions on the resolved Compose config (31 checks: ports, namespaces, mounts, networks, env ownership) |

## Review-time validation (already recorded 2026-10-25)

```sh
sh validate-fixtures.sh .
```

Expected: `== summary: 55 passed, 0 failed ==` and `SCRATCH_FIXTURE_VALIDATION_PASS`. These fixtures are byte-identical to the ones validated test-first in the scratch preparation review (red 0/54 → green 55/55 → doc-extraction byte-identical).

Offline Compose structural check (no resources created):

```sh
docker compose -f probe/b1-phase-b/compose.yaml config --quiet
```

Ownership-review boundary assertions (also config-only, no resources created):

```sh
sh check-compose-boundaries.sh compose.yaml <work-dir>
```

Expected: `31 passed, 0 failed` and `COMPOSE_BOUNDARY_CHECK_PASS` (sensitivity-proven 2026-10-25 against a deliberately broken copy — see [the ownership review](../../docs/milestones/B1-phase-b-ownership-review-20261025.md)).

## Execution boundary (must hold at runtime)

1. **Never run from this repository checkout.** Copy this directory into a task-owned working directory outside the repo, generate `baseline.tar` there with `git archive --format=tar -o baseline.tar eab6b2a85d46548fa3df3403c82c333d336e3bc6`, and run Compose from that copy with a unique project id (`stack-parity-b1-runtime-20261025` unless taken).
2. **Execution requires the ownership review to pass and explicit user authorization** — see the isolation plan's review sequence. `prepare` and `runtime` are never started together; after preparation, only `runtime` starts, with `--no-deps`.
3. The pinned image ID (`sha256:1af3cd…`) must be re-verified as present before any launch; the environment redirects `HOME`, all XDG roots, `TMPDIR`, the pnpm store and `PRISMA_COMPOSER_EMULATORS_DIR` into the task-owned `scratch` volume; no host port is published and the runtime has no network.
4. Cleanup uses only the reviewed, ownership-checked procedure from the isolation plan; never `down -v` against other projects, never global Prisma state deletion.
