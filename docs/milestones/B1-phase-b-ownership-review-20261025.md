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

- **Update (2026-10-25, pre-execution):** the originally pinned Phase A image (`sha256:1af3cd0f…`) was found **removed** between two read-only inspections of this review session (no delete command was run in the session; cause unknown — possibly host-side Docker cleanup). Per the plan's presence-first rule, execution paused; the toolchain was **rebuilt** from the committed `Dockerfile.dev` (verified byte-identical to baseline `eab6b2a8` modulo CRLF checkout). New image ID `sha256:2ea151b932088e8f9d5c80ec3fac1ffa3e2627fd8c7277b56db0f8606eccec45`, effective user `node`. Because the active containerd image store does not resolve Compose `sha256:`-ID references reliably, the fixtures now reference the toolchain **by tag** (`stackparity-b1-probe-dev:latest`, `pull_policy: never`) and the boundary checker verifies the tag resolves to the recorded image ID (checker caught the stale sha-red reference first: `29/2` → fixed → `31/0` green).
- Original provenance record: the Phase A image was created `2026-10-13T10:53:19Z` and never rebuilt; that record is retained for history. The rebuilt image carries the same committed recipe: `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, `node:24-bookworm-slim`, global `pnpm@11.28.5` + `bun@1.4.3`, so the compute daemon's PATH-based `bun` resolution (pinned source closure requirement) remains satisfied; `prepare.sh` step 0 re-records versions at execution time.

## What this review does not authorize

No `prepare` or `runtime` launch, no dependency install, no contract emission, no migration apply, no seeding, no cloud operation. The runtime container's live mounts/environment are verified statically here; execution-time verification repeats via `prepare.sh` provenance output and the isolation plan's stop conditions. `LOCAL_TOOLCHAIN_PASS` unchanged; `LOCAL_DB_PASS` NOT RUN; D-B1-01..03 remain open.

**Review sequence status:** step 1 (pinned source closure) — complete; step 2 (scratch preparation review) — complete; step 3 (ownership review) — **complete (this document)**; step 4 (runtime acceptance) — **requires explicit user authorization**.
