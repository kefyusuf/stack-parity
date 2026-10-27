# B1-D Phase B — Ownership Review (2026-10-25)

**Status: REVIEW COMPLETE — execution still requires explicit user authorization.** No container, volume, network, install, migration, database, emulator or cloud operation was created or started. Only read-only Docker commands were used (`compose config`, `image inspect`, label-filtered listings). This closes review-sequence step 3 of [the isolation plan](B1-phase-b-isolation-plan.md); step 4 (runtime acceptance) remains gated.

## Method (test-first boundary checker)

The committed [`probe/b1-phase-b/check-compose-boundaries.sh`](../../probe/b1-phase-b/check-compose-boundaries.sh) resolves the Compose model with `docker compose config --format json` (creates no Docker resources) and asserts 31 boundary properties on the resolved services, mounts, environment, networks and volumes.

1. **RED / sensitivity** — a deliberately broken fixture copy (host port published, `network_mode: bridge`, a `/var/run/docker.sock` bind, `external: true` scratch volume) produced six targeted failures — `runtime: publishes ports`, `runtime: Docker socket mounted`, `runtime: writable bind mounts`, `runtime: unexpected bind mounts`, `runtime: network_mode: bridge`, `scratch volume missing or external` — with `== node summary: 24 passed, 6 failed ==`, `COMPOSE_BOUNDARY_CHECK_FAIL`, exit `1`. The first checker version's summary line under-counted node-internal failures; the sensitivity run exposed this and the counter was fixed **before** the green run (recorded honestly).
2. **GREEN** — the committed [`probe/b1-phase-b/compose.yaml`](../../probe/b1-phase-b/compose.yaml): `31 passed, 0 failed`, exit `0`, `COMPOSE_BOUNDARY_CHECK_PASS`.

## Boundaries asserted (31 checks, grouped)

- **Services & image:** exactly `prepare` + `runtime`; both pinned to the reviewed toolchain image `sha256:1af3cd0f…`, `user: node`, `pull_policy: never` (no registry pull at launch).
- **Isolation:** no published ports on either service; not privileged; no host PID or IPC namespaces; runtime `network_mode: none` (offline, loopback-only); no external or host networks; no custom networks.
- **State ownership:** both services carry the identical task-owned environment — `HOME=/workspace/home`, all four XDG roots, `TMPDIR=/workspace/tmp`, `PNPM_CONFIG_STORE_DIR=/workspace/node_modules/.pnpm-store`, `PRISMA_COMPOSER_EMULATORS_DIR=/workspace/state/emulators` — matching the [pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) finding that `@prisma/dev` state follows `XDG_*`/`HOME` only.
- **Mounts:** no Docker socket anywhere; every bind mount read-only; `prepare` mounts exactly the three inputs (`baseline.tar`, `prepare.sh`, `manifest-additions.json`) plus the `scratch` volume; `runtime` mounts **no** bind at all, only `scratch`.

> **Amendment (2026-10-25, post-review, pre-execution):** the runtime-readiness check exposed a missing fourth input — the probe fixture overlay — and the boundary checker caught it red-first (`30/1`) before the fixture fix. `prepare` now mounts exactly **four** read-only inputs (`baseline.tar`, `prepare.sh`, `manifest-additions.json`, `probe-fixtures.tar`) plus `scratch`, and the checker asserts all four (`31/0` green). Runtime-readiness gap recorded in [the scratch preparation review](B1-phase-b-scratch-preparation-20261025.md).
- **Runtime entry:** `init: true`, `working_dir: /workspace/probe`, command exactly `pnpm exec prisma dev probe/module.ts`; `scratch` volume is task-owned (not external).

## Resource inventories (read-only, 2026-10-25)

Label-filtered inventories for `com.docker.compose.project=stack-parity-b1-runtime-20261025`: **containers 0, volumes 0, networks 0** — nothing pre-existing carries the task identity, so any future match is task-created.

## Expected creation ledger (runtime cleanup comparison)

When execution is later authorized, the reviewed Compose project is expected to create exactly:

| Kind | Expected name |
| --- | --- |
| Container (one-off) | `stack-parity-b1-runtime-20261025-prepare-1` (`run --rm`) |
| Container (acceptance) | `stack-parity-b1-runtime-20261025-runtime-1` |
| Volume | `stack-parity-b1-runtime-20261025_scratch` |
| Network | `stack-parity-b1-runtime-20261025_default` |

Cleanup must compare actual label-filtered inventories against this ledger; any unexpected member is a stop condition, never a deletion target.

## Toolchain provenance

- The pinned image is present locally: created `2026-10-13T10:53:19Z` (the Phase A toolchain image; not rebuilt).
- Image environment: `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, `NODE_VERSION=24.21.0`. `bun@1.4.3` is installed globally into `/usr/local/bin` by the committed `Dockerfile.dev`, so the compute daemon's PATH-based `bun` resolution (pinned source closure requirement) is satisfied statically; Phase A preflight additionally recorded `bun --version` = `1.4.3` from this image, and `prepare.sh` step 0 re-records it at execution time.

## What this review does not authorize

No `prepare` or `runtime` launch, no dependency install, no contract emission, no migration apply, no seeding, no cloud operation. The runtime container's live mounts/environment are verified statically here; execution-time verification repeats via `prepare.sh` provenance output and the isolation plan's stop conditions. `LOCAL_TOOLCHAIN_PASS` unchanged; `LOCAL_DB_PASS` NOT RUN; D-B1-01..03 remain open.

**Review sequence status:** step 1 (pinned source closure) — complete; step 2 (scratch preparation review) — complete; step 3 (ownership review) — **complete (this document)**; step 4 (runtime acceptance) — **requires explicit user authorization**.
