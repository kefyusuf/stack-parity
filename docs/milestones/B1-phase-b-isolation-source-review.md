# B1-D Phase B Isolation — Source Review (2026-10-25)

**Status: STATIC SOURCE REVIEW ONLY. Phase B has not run and is not authorized by this note.**

Question: can a disposable Linux container contain the pinned Composer Compute/Postgres emulators without using the host Docker socket or the existing application's state?

## Provenance

Composer tag `v0.29.1` resolves to commit [`c407d48c85ef47d082a3d0293b09d6925361e287`](https://github.com/prisma/composer/commit/c407d48c85ef47d082a3d0293b09d6925361e287). All implementation references below use that immutable commit. StackParity's baseline pins Composer `0.29.1` and Prisma CLI `8.0.0-rc.22`; no package installation or version change was performed for this review.

The tagged public [Cloud package manifest](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/9-public/composer-prisma-cloud/package.json) depends on `@prisma/dev ^0.25.2`. StackParity's [committed lockfile](https://github.com/kefyusuf/stack-parity/blob/eab6b2a85d46548fa3df3403c82c333d336e3bc6/pnpm-lock.yaml) resolves Cloud's copy to `0.25.2` and also contains a separate Alchemy `0.20.0` copy. The tagged [provider resolver](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/local-target/src/postgres.ts#L38-L52) resolves `@prisma/dev` from Composer's own package, rather than the application's copy. **Category:** implementation detail; **version:** Composer `0.29.1`; **confidence:** high for source/lockfile, not installed-probe proof.

## Findings

| Claim | Category / version / confidence | Primary source |
| --- | --- | --- |
| Emulator registry defaults to `~/.prisma-composer/emulators`; `PRISMA_COMPOSER_EMULATORS_DIR` accepts an absolute override. Registry JSON, daemon logs and per-daemon state directories derive from this root. | Implementation detail; Composer `0.29.1`; high | [daemon.ts, registry resolution](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/daemon.ts#L118-L156) |
| Daemons run as detached, unreferenced child processes of `process.execPath`, receiving `--port` and `--state-dir`. They intentionally outlive the command that ensured them. This launch path does not invoke Docker or a Docker API. | Implementation detail; Composer `0.29.1`; high for this launch path only | [daemon.ts, process launch](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/daemon.ts#L311-L330) |
| Compute is ensured for local applications; Postgres is additionally ensured when the graph declares `postgres` or `raw-postgres`. | Implementation detail; Composer `0.29.1`; high | [emulators.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/1-extensions/target/src/local-target/emulators.ts) |
| Compute starts the application using `spawn(bunPath, ['bootstrap.js'], { cwd: artifactDir, env, ... })`. Its admin HTTP listener binds `127.0.0.1`. | Implementation detail; Composer `0.29.1`; high | [compute-main.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/compute-main.ts#L422-L428), [admin listener](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/compute-main.ts#L817-L825) |
| Postgres hosts `@prisma/dev.startPrismaDevServer` in its daemon process, with a named server and `persistenceMode: 'stateful'`. The source describes PGlite/native-WASM runtime and gives the daemon SIGTERM/SIGINT handlers that close its servers. | Implementation detail; Composer `0.29.1`; high for Composer source, not the full dependency's filesystem/download behavior | [postgres-main.ts, start](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/postgres-main.ts#L600-L609), [shutdown](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/dev-emulators/src/postgres-main.ts#L856-L871) |
| Local provider namespaces derive from the resolved application's name. A distinct checkout directory alone is insufficient evidence of isolation for this tagged code. | Implementation detail; Composer `0.29.1`; high | [app-name.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/0-lowering/local-target/src/app-name.ts#L12-L22) |
| The dev container descriptor is a logical local identity (`projectId = 'local'`), with no platform credentials or remote branch. It is not a request to start a Docker container. | Implementation detail; Composer `0.29.1`; high | [local-target/container.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/packages/1-prisma-cloud/1-extensions/target/src/local-target/container.ts) |

## Documentation drift

The live [Composer local-development guide](https://www.prisma.io/docs/composer/local-development) returned differing revisions during this review: one described machine-shared emulators and a database `--fresh` failure; another described directory isolation, changed stop/reset behavior, and explicitly introduced `prisma dev url`, `prisma dev stop`, `--detach`, and `prisma emulator list` in CLI `8.0.0-rc.24`.

**Category:** documented behavior, mutable current documentation; **version:** the newer commands explicitly require `rc.24+`; **confidence:** high that they must not be assumed available in pinned `rc.22`. The old/new reset behavior conflict is unresolved for this project's installed dependency set. Use tagged source and the actual pinned CLI help; do not silently upgrade or use those newer commands. The proposed probe should continue to exclude `--fresh`.

## Container design inference and limits

**Inference / confidence medium:** a task-owned Linux container with its own process/network namespaces, a fresh writable home, an explicit emulator registry root, and no host state/socket mounts is a reasonable containment boundary for these subprocess-based emulators. Detached processes are not evidence of host processes when they are launched inside that boundary. This is not a successful container/ORM test.

Requirements for the candidate plan:

- Use a new task-specific Compose project, a unique module/app name, and only newly created volumes. Never reuse the main app's `stack-parity` identity or mount its `.alchemy`, `.prisma-composer`, home, credentials, Docker socket, host PID namespace or host network.
- Put `HOME`, XDG state/data/cache/config directories, temporary files, project state and `PRISMA_COMPOSER_EMULATORS_DIR` inside the disposable boundary. The registry override alone does **not** establish where `@prisma/dev` persists its own data.
- Keep the application listener and database private to the runtime container; exercise HTTP/SQL from inside it. No host port publication is needed for the proposed proof.
- Stop the task container, inspect actual remaining task-owned containers/resources, and remove only the newly created Compose project's volumes/network. This avoids relying on a newer Prisma stop/reset command. Never signal a host PID taken from old emulator state.

## Blocking unknowns before runtime

1. **Installed dependency proof:** resolve the exact `@prisma/dev` imported by the scratch Cloud package and inspect its version, export map, state-root selection and first-use download behavior. The tagged source and baseline lockfile do not prove a newly prepared scratch peer tree.
2. **Offline start:** `network_mode: none` is a useful proposed fail-closed runtime boundary, but this review has **not** proven the full CLI/ORM/dev dependency graph starts without downloading first-use assets. Do not add a guessed preload/download command or relax network isolation on failure; capture the missing asset and review preparation separately.
3. **Filesystem coverage:** before resource creation, verify the container's home/XDG/temp values and actual mounts. Record any state path that would fall outside disposable volumes or the container's writable layer. Unknown paths block a cleanup-complete claim.
4. **Installed APIs and readiness:** verify the pinned CLI's actual help and local Postgres provisioning output. A tag-level API, daemon ready message, or successful compile is insufficient to claim the database is readable or the ORM integration works.

**Conclusion:** source supports a subprocess-contained probe design without a mounted Docker socket. Full socket independence, offline startup, dependency resolution and cleanup completeness remain runtime assumptions until inspected and tested in the reviewed disposable boundary. `LOCAL_DB_PASS`, D-B1-01 closure, Product implementation and cloud operations remain pending.
