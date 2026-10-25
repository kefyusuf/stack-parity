# B1-D Phase B — Pinned Source Closure (2026-10-25)

**Status: STATIC CLOSURE COMPLETE — no container, install, migration, database, emulator or cloud operation was performed or authorized.** Phase B runtime / `LOCAL_DB_PASS` remains NOT RUN. [B1 gate](B1-product-read-api-gate.md) and the [isolation plan](B1-phase-b-isolation-plan.md) still govern everything.

## Question closed by this review

Which exact dependency versions and filesystem state roots would a prepared Phase B scratch probe use, and does the pinned stack require first-use network downloads? This closes **Blocking unknown #1** of [the Phase B source review](B1-phase-b-isolation-source-review.md) at source level.

## Provenance and method

- Repository side: read-only inspection of the committed `pnpm-lock.yaml` / manifests. `git diff main --stat -- pnpm-lock.yaml package.json pnpm-workspace.yaml module.ts prisma.config.ts` returned empty, so the inspected lockfile is exactly remote `main`'s baseline at `eab6b2a85d46548fa3df3403c82c333d336e3bc6`.
- Upstream side: immutable Composer tag `v0.29.1` = commit [`c407d48c85ef47d082a3d0293b09d6925361e287`](https://github.com/prisma/composer/commit/c407d48c85ef47d082a3d0293b09d6925361e287), plus the **published npm package artifacts** for `@prisma/dev@0.25.2`, `@prisma/query-plan-executor@7.2.0` and `@prisma/streams-local@0.1.11` (manifests, type declarations and bundled `dist/` files).
- Method: static file reading only. Confidence is **high** for what the pinned artifacts contain and **absent for runtime behavior**; nothing here substitutes for the executed probe.

## Resolved dependency closure

| Package | Role | Version | Evidence |
| --- | --- | --- | --- |
| `@prisma/composer` | root dependency; module/config surface | `0.29.1` | root `package.json`; lockfile importer |
| `@prisma/composer-prisma-cloud` | root dependency; cloud/local-target extension | `0.29.1` | root `package.json`; declares **exact peer** `@prisma/orm-postgres@8.0.0-rc.17` (lockfile `peerDependencies` entry) |
| `prisma` CLI | devDependency; `prisma dev` launcher | `8.0.0-rc.22` | root `package.json` |
| `@prisma/dev` | Postgres dev-server engine used by Composer's daemons | `0.25.2` | Composer cloud's own dependency, resolved from its package (source review, `postgres.ts`); lockfile resolves `0.25.2` alongside a second unrelated `0.20.0` copy owned by Alchemy's graph |
| `@prisma/orm-postgres` | ORM client for the `postgres()` path | `8.0.0-rc.17` | exact peer of composer-prisma-cloud; currently present only via pnpm's automatic peer install — **a scratch manifest must declare it explicitly**, not rely on implicit peers |
| `@electric-sql/pglite` (+ `-socket`, `-tools`) | WASM Postgres engine under `@prisma/dev` | `0.4.3` (`0.1.3` / `0.3.3`) | `@prisma/dev@0.25.2` dependencies |
| `@prisma/query-plan-executor` | dependency of `@prisma/dev` | `7.2.0` | **no dependencies, no lifecycle scripts**, `files: ["dist"]` |
| `@prisma/streams-local` | local streams emulator under `@prisma/dev` | `0.1.11` | **no lifecycle scripts**; depends on `env-paths` |
| `vite` → `esbuild` | optional peer chain of `@prisma/dev` | `8.3.4` → `0.28.2` | lockfile resolution; esbuild platform binary arrives as an optional dependency from the registry |

`@prisma/dev@0.25.2` publishes exports `.`, `./internal/daemon`, `./internal/db`, `./internal/state`, `./vite` and a named export `startPrismaDevServer(options): Promise<ProgrammaticServer>` (explicitly documented "DO NOT USE IN PRODUCTION"), matching the call shape Composer's postgres daemon uses.

## First-use asset behavior — no engine download indicated

- The `@prisma/dev@0.25.2` tarball **ships the engine inside the package**: `dist/runtime-assets/` contains `pglite.wasm`, `pglite.data`, `initdb.wasm`, `pglite-seed.tar.gz` and per-extension archives (`vector.tar.gz` included).
- Asset resolution is local by default: module-relative `dist/runtime-assets/` first, falling back to the resolved `@electric-sql/pglite` package directory. Network `fetch` exists only for **non-`file:` URLs supplied via the bundle manifest or a global override registry** — no such override exists in the pinned tree.
- None of `@prisma/dev`, `@prisma/query-plan-executor`, `@prisma/streams-local` declares install lifecycle scripts.
- **Static conclusion:** a frozen registry install inside the probe should carry every engine asset; no first-use download is indicated. This remains an assumption until the `network_mode: none` runtime start passes (fail-closed by design: on failure, capture the missing asset and review preparation — never relax the network boundary).

## Filesystem state map (Linux, per pinned sources)

| What | Location | Selected by |
| --- | --- | --- |
| Compute daemon state + per-app logs | `<EMULATORS_DIR>/…/apps.json` (mode `0600`), `logs/<app>/*.log` | `--state-dir` argument; `apps.json` write in compute-main.ts |
| Postgres daemon registry/state file | same `--state-dir` pattern | daemon.ts / postgres-main.ts |
| `@prisma/dev` stateful server data | `$XDG_DATA_HOME/prisma-dev-nodejs/<server-name>/.pglite`, `server.json`, `.lock`, `db_dump.bak`; durable-streams under the same data root | env-paths-style resolver in `@prisma/dev` ("prisma-dev", nodejs suffix) — **reads only `XDG_*`/`HOME`/`APPDATA`/`LOCALAPPDATA`, no `PRISMA_*` override** |
| Engine/query-plan cache | `$XDG_CACHE_HOME/prisma-dev-nodejs/engine/…` | same resolver |
| Streams emulator state | passed-in SQLite path resolved under the `@prisma/dev` data root | caller; exact dir not fully traced (bundle truncation) |
| Runtime asset copy target | caller-supplied directory | `copyPrismaDevRuntimeAssets(dest)`; not statically pinned |
| App artifact directory (bootstrap bundle) | constructed by the `prisma dev` launcher per deployment request | **not located in the reviewed files**; used only as the compute child's cwd |

**Key consequence for the isolation plan:** `PRISMA_COMPOSER_EMULATORS_DIR` governs Composer's daemon registry only. `@prisma/dev`'s own persisted data follows `XDG_*`/`HOME`. The plan's single `HOME=/workspace/home` with `XDG_CONFIG/CACHE/DATA/STATE_HOME` redirections therefore covers every statically identified state root, and no additional override is available or needed for `@prisma/dev`. `TMPDIR` covers the env-paths temp branch.

## Runtime requirements surfaced for the probe

1. **`bun` must be on `PATH`** in the runtime container: Composer's compute daemon resolves `bun` by scanning the *request's* `env.PATH` (POSIX-only) and refuses to start the app otherwise; it does not bundle or download Bun. The existing toolchain image provides Bun `1.4.3` (Phase A evidence) — verify presence before launch.
2. The Postgres database port is chosen dynamically in `51300–65535` and binds loopback inside the container; the admin listeners bind `127.0.0.1`. Verification must run via `exec` inside the runtime container; no host port publication is needed or permitted.
3. The compute child runs the app artifact from a per-request `artifactDir` — its location must be proven to stay inside the owned volume during the ownership review (mount inspection before launch), because the launcher code that constructs it was not among the files traced.

## Remaining unknowns (block runtime claims only, not planning)

1. Actual offline start of the full CLI/ORM/daemon graph under `network_mode: none` — the fail-closed probe is the test.
2. Runtime location of the app artifact directory and the runtime-asset copy target — verify inside the owned volume via mount inspection.
3. `streams-local`'s exact state directory — expected under the XDG data root; confirm at runtime.
4. Scratch manifest, standalone lockfile, `prepare.sh` spec, ORM client wiring and connection-string delivery — the **next** review step (scratch preparation review), not closed here.

## Outcome

- **Pinned source closure: COMPLETE (static evidence only).** Source-review blocking unknown #1 is closed at source level: exact versions, export surface, state roots and first-use asset behavior are recorded above.
- `LOCAL_TOOLCHAIN_PASS` unchanged; `LOCAL_DB_PASS` NOT RUN; D-B1-01 unresolved until the executed probe passes.
- Next gates in order: scratch preparation review → ownership review → separately authorized runtime acceptance.
