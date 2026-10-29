# B1-D Phase B — Local Probe Isolation Review

**Status: PROPOSED / NOT EXECUTED.** This document prepares a disposable compatibility probe for review. It does not authorize database creation, Product implementation or cloud operations. [B1 gate](B1-product-read-api-gate.md) and the current AGENTS.md boundaries still apply.

## Decision and evidence boundary

Use one new Compose project to contain the entire local Composer process tree and its state. Do not recreate the removed sibling checkout, reuse the main development stack, or mount the host's Docker socket or Prisma home. Source evidence is recorded in [the versioned source review](B1-phase-b-isolation-source-review.md); this is a source-supported isolation design, not runtime proof.

Composer `0.29.1` supports an absolute `PRISMA_COMPOSER_EMULATORS_DIR`; set it explicitly inside the task's volume. Its emulator launcher starts child processes, so a dedicated Linux container can provide the process boundary without access to the host Docker daemon. Whether the entire pinned dependency stack works within that boundary remains to be tested. Current online documentation must not override the pinned CLI's actual behavior.

## Owned resources and prohibitions

| Boundary | Proposed value / check before creation |
| --- | --- |
| Compose project | `stack-parity-b1-runtime-20261025`; require no matching containers, volumes or networks; choose a new reviewed ID on collision |
| Composer module/app | `stack-parity-b1-runtime-20261025`; never `stack-parity` |
| Scratch source | `/workspace/probe`; export reviewed baseline `eab6b2a85d46548fa3df3403c82c333d336e3bc6`, then make experimental changes only inside the volume |
| Task-owned data | One new Compose `scratch` volume at `/workspace`; app, generated contracts/migrations, dependencies, HOME, temporary files and emulator state stay there |
| Emulator state | `PRISMA_COMPOSER_EMULATORS_DIR=/workspace/state/emulators` |
| Other state | `HOME=/workspace/home`, XDG config/cache/data under that HOME, `TMPDIR=/workspace/tmp` |
| Credentials | No host home, credential file, `.env`, `.npmrc`, Docker socket or cloud token mounts; no credential environment forwarding |
| HTTP / DB access | No published ports or host networking; verification runs inside the runtime container against observed loopback endpoints |
| Runtime network | `network_mode: none`; local loopback only; failure to start offline is BLOCKED, not permission to enable outbound access |
| Existing resources | Main Compose volumes, older probe resources, global emulators and `spike-001` remain untouched |

The module name alone is insufficient: emulator directory, HOME, process namespace and network namespace must all be isolated. A unique Compose project alone is insufficient if a host home or Docker socket is mounted.

## Proposed Compose shape

This is a configuration review fixture, not a command to run now. `prepare` is for a separately reviewed dependency/materialization step; `runtime` is the only Composer launcher. Neither has an automatic restart policy. No service is started by the documentation validation.

> **Source of truth (2026-10-25):** the fixture below is committed as a real file at [`probe/b1-phase-b/compose.yaml`](../../probe/b1-phase-b/compose.yaml), together with the `prepare.sh` / `manifest-additions.json` / `probe/*` fixtures and the validator it references. The committed copy carries two deltas recorded there: the additional `./manifest-additions.json:/input/manifest-additions.json:ro` prepare mount and the corrected runtime entry (`prisma dev probe/module.ts`). The YAML block below is retained as the originally reviewed shape; on drift the committed file wins.

```yaml
services:
  prepare:
    image: sha256:1af3cd0f9671b746f49dfa7b624228c5b1441efcd3a98bdec48267cde4a2e9d5
    pull_policy: never
    user: node
    working_dir: /workspace
    environment: &probe-environment
      HOME: /workspace/home
      XDG_CONFIG_HOME: /workspace/home/.config
      XDG_CACHE_HOME: /workspace/home/.cache
      XDG_DATA_HOME: /workspace/home/.local/share
      XDG_STATE_HOME: /workspace/home/.local/state
      TMPDIR: /workspace/tmp
      PNPM_CONFIG_STORE_DIR: /workspace/node_modules/.pnpm-store
      PRISMA_COMPOSER_EMULATORS_DIR: /workspace/state/emulators
    command: [sh, /input/prepare.sh]
    volumes:
      - ./baseline.tar:/input/baseline.tar:ro
      - ./prepare.sh:/input/prepare.sh:ro
      - scratch:/workspace
  runtime:
    image: sha256:1af3cd0f9671b746f49dfa7b624228c5b1441efcd3a98bdec48267cde4a2e9d5
    pull_policy: never
    user: node
    init: true
    network_mode: none
    working_dir: /workspace/probe
    environment: *probe-environment
    command: [pnpm, exec, prisma, dev, module.ts]
    volumes:
      - scratch:/workspace
volumes:
  scratch:
```

The immutable toolchain image was available during Phase A; inspect its presence and effective user again before any future use. `prepare.sh` is specified as a reviewed fixture but still not executed; [the scratch preparation review](B1-phase-b-scratch-preparation-20261025.md) covers the exact scratch manifest additions, the probe-owned lockfile procedure, offline contract emission and CLI-authored migrations, and adds one required read-only mount (`./manifest-additions.json:/input/manifest-additions.json:ro`) that the ownership review must inspect. Do not copy upstream `workspace:` or `catalog:` references verbatim or edit the product's dependencies. The runtime volume must contain all required assets before its network is disabled.

## Review sequence before any runtime launch

1. **Pinned source closure (NOW):** match Composer and Prisma CLI package behavior to `0.29.1` / `8.0.0-rc.22`, including resolved Postgres-emulator dependencies. Establish where first-use assets are obtained and cached. Record gaps; do not assume the previous baseline install fetched all runtime assets. **Complete at source level (2026-10-25):** see [the pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) — `@prisma/dev@0.25.2` ships the PGlite engine assets and selects its own state roots from `XDG_*`/`HOME` only (no `PRISMA_*` override); no first-use download is indicated; the runtime container must keep `bun` on `PATH`; a scratch manifest must declare the exact peer `@prisma/orm-postgres@8.0.0-rc.17` explicitly instead of relying on automatic peer installation.
2. **Scratch preparation review (NEXT):** specify a standalone manifest with the approved ORM version, its own reproducible lockfile and the exact tagged example transformation. The fixture is a probe table, not a Product endpoint. Validate module name, emitted contract path, migration graph and local-only resource wiring before executing them. **Complete at specification level (2026-10-25):** see [the scratch preparation review](B1-phase-b-scratch-preparation-20261025.md) — validated test-first (red 0/54 → green 55/55 → doc-extraction byte-identical) and specifying the unique module identity, explicit `@prisma/orm-postgres@8.0.0-rc.17` + `pg@8.22.0` additions, offline contract emission, CLI-authored migrations and a read-only loopback probe service. Execution remains unauthorized.
3. **Ownership review (NEXT):** record empty label-filtered inventories, exact new resource names and creation output. Inspect resolved Compose config for no ports, no external volumes, no host network/PID namespace and no credential/socket mounts. Inspect the runtime container's mounts/environment and fail before `prisma dev` if any boundary is wrong. **Complete (2026-10-25, static):** see [the ownership review](B1-phase-b-ownership-review-20261025.md) — 31 boundary assertions pass on the committed Compose fixture (sensitivity-proven against a broken copy), label-filtered inventories are empty, the toolchain image and `bun`-on-`PATH` provenance are recorded, and the expected creation ledger for cleanup comparison is fixed. Runtime launch itself remains unauthorized.
4. **Runtime acceptance (after explicit review/authorization):** start the isolated module without `--fresh`; record observed service and local DB identity. Through the real ORM, read the seeded row, update it out-of-band in that same disposable DB and read again; then test empty data and unavailable DB. Never print connection URLs or secrets. Do not substitute a mocked read or direct SQL-only read for ORM proof. **Executed and passed (2026-10-27):** see [the runtime probe evidence](B1-phase-b-runtime-evidence-20261027.md) — `LOCAL_DB_PASS` for the technical runtime portion; automatic migration apply at bootstrap observed; ledger-compared teardown left zero task-labeled resources.
5. **Stop and cleanup:** stop the whole task container, then remove only this task's recorded resources. Verify empty inventories and retain a nonsecret evidence report. A daemon merely stopping is not proof its persisted state was removed; the task volume must also be removed.

Preparation and runtime are separate steps: never run a Compose `up` that starts both services together. After an approved preparation run, launch only `runtime` with `--no-deps`. No host listener is necessary; use a separate `exec` process in the same container for verification.

## Cleanup contract

Use the same reviewed Compose file and project ID. Before cleanup, compare container/volume/network IDs and labels with the task's creation ledger. Any pre-existing resource, unexpected project member or missing ownership evidence is a stop condition. Do not delete a resource solely because its name looks related.

```powershell
docker compose -p stack-parity-b1-runtime-20261025 -f $probeCompose ps --all
docker compose -p stack-parity-b1-runtime-20261025 -f $probeCompose down --volumes --remove-orphans
docker ps -a --filter label=com.docker.compose.project=stack-parity-b1-runtime-20261025
docker volume ls --filter label=com.docker.compose.project=stack-parity-b1-runtime-20261025
docker network ls --filter label=com.docker.compose.project=stack-parity-b1-runtime-20261025
```

These commands are a future cleanup protocol, not cleanup evidence. Require successful exit codes and empty filtered inventories. If shutdown hangs, inspect and stop only recorded task container IDs; never terminate host-wide Prisma/Postgres processes. Do not run `prisma dev rm`, `--fresh`, global prune or delete a host emulator directory. Keep existing images.

## Current disposition

- `LOCAL_TOOLCHAIN_PASS`: retained from [the executed Phase A report](B1-toolchain-preflight-20261025.md); not rerun for this documentation change.
- **Static isolation design:** ready for review; Compose structure can be validated offline without starting services.
- **Offline runtime / ORM / DB:** **EXECUTED AND PASSED (2026-10-27)** — see [the runtime probe evidence](B1-phase-b-runtime-evidence-20261027.md). The offline start under `network_mode: none` succeeded; first-use assets came entirely from the frozen install, as the pinned source closure predicted.
- **D-B1-01:** runtime portion resolved by the executed probe. **D-B1-02:** proposed HTTP contract still needs reviewer sign-off. **D-B1-03:** local reset procedure evidence recorded; stage seed, budget, owner and retention remain unresolved.
- **Cloud:** zero cloud operations authorized by this plan. A stage seed mechanism must be private and separately reviewed; no public mutation route or startup reseeding. No stage ID, paid budget or teardown decision is silently chosen here.

## Documentation validation (2026-10-25)

The YAML block above was extracted to a temporary Compose file and resolved using `docker compose -p stack-parity-b1-runtime-20261025 -f <temporary-file> config --format json`. The command and structural assertions exited `0`: two toolchain services, runtime network `none`, node user, no published ports/host namespaces/privileged mode, read-only task input mounts, a non-external scratch volume, and the explicit emulator state root. Both services share the same task-owned HOME/XDG/temp/store/state paths so preparation cannot silently populate a different runtime cache. Temporary configuration was removed. No container, network, volume, dependency install or database was created. This validates configuration syntax and intended boundaries only; image availability, permissions, offline assets, actual mounts and ORM runtime behavior remain unverified for Phase B.
