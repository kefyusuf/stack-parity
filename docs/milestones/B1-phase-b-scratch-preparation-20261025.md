# B1-D Phase B — Scratch Preparation Review (2026-10-25)

**Status: PROPOSED / NOT EXECUTED.** This document specifies and validates the disposable scratch materialization for the Phase B runtime probe. It is a review fixture for a **probe table**, not a Product endpoint. No container, volume, install, migration, database, emulator or cloud operation was performed or authorized. [B1 gate](B1-product-read-api-gate.md), [isolation plan](B1-phase-b-isolation-plan.md) and [pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) still govern everything.

> **Source of truth moved (2026-10-25):** the fixtures below are now committed as real files under [`probe/b1-phase-b/`](../../probe/b1-phase-b/README.md) — `compose.yaml`, `prepare.sh`, `manifest-additions.json`, `prisma.config.ts`, `probe/*` and `validate-fixtures.sh` — re-validated there (`55 passed, 0 failed`; `docker compose config` exit `0`; root typecheck/tests unaffected). The committed files supersede this document's embedded copies on any drift; the embedding below is retained as the recorded evidence of the test-first validation.

## Purpose

This closes review-sequence step 2 of the isolation plan: a standalone scratch manifest with explicit pinned dependencies, a probe-owned lockfile procedure, the exact tagged-example transformation, and a `prepare.sh` specification — validated test-first (see evidence below) before any execution is requested. Review-sequence step 3 (ownership review) and step 4 (authorized runtime acceptance) remain open.

## Provenance

- Upstream shape source: the immutable Composer `v0.29.1` ORM example, commit [`c407d48c85ef47d082a3d0293b09d6925361e287`](https://github.com/prisma/composer/commit/c407d48c85ef47d082a3d0293b09d6925361e287): [module.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/module.ts), [src/service.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/src/service.ts), [src/server.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/src/server.ts), [contract.prisma](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/contract.prisma), [prisma.config.ts](https://github.com/prisma/composer/blob/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/prisma.config.ts) and its [migration triplet](https://github.com/prisma/composer/tree/c407d48c85ef47d082a3d0293b09d6925361e287/examples/orm-demo/migrations).
- Version basis: [pinned source closure](B1-phase-b-pinned-source-closure-20261025.md) — `@prisma/composer` / `@prisma/composer-prisma-cloud` `0.29.1`, CLI `8.0.0-rc.22`, exact peer `@prisma/orm-postgres@8.0.0-rc.17`, `@prisma/dev@0.25.2` with bundled PGlite `0.4.3` engine assets.
- Repository basis: read-only archive of remote `main` at `eab6b2a85d46548fa3df3403c82c333d336e3bc6` (the isolation plan's `baseline.tar`).
- Method: all fixtures below were authored under `test-first` discipline in a temporary sandbox; assertions ran **red** before the fixtures existed and **green** after, and were re-run against fixtures re-extracted from this document. No runtime claim is made.

## Test-first evidence (2026-10-25, Windows Git Bash; Node v26.8.2)

The validator below asserts structural properties of the fixtures: file presence, exact pinned versions, unique probe identity, read-only handler, loopback binding, no credentials, and `prepare.sh` prohibitions (`--fresh`, `prisma dev`, `db migrate`, `prisma deploy`, `down -v` must not appear).

1. **RED** — validator run against an empty directory: `== summary: 0 passed, 54 failed ==`, `SCRATCH_FIXTURE_VALIDATION_FAIL`, exit `1`.
2. Two mid-cycle corrections were made (recorded honestly): the validator's manifest check initially resolved a `require` path against the module directory instead of the working directory, and the PSL fixture used aligned double spaces where the assertion expected single spaces. Both were fixed; **RED was re-confirmed** after the fixes: `0 passed, 54 failed`, exit `1`.
3. **GREEN** — validator run against the authored fixtures: `PASS: manifest-additions.json structure`, `== summary: 55 passed, 0 failed ==`, `SCRATCH_FIXTURE_VALIDATION_PASS`, exit `0`.
4. **Doc-extraction verification** — all nine fenced fixture blocks were extracted from this document by fence language and order (Node parser, recorded in the review session): `diff -r` against the validated fixture directory showed every fixture byte-identical, and the validator on the extracted copy reported `55 passed, 0 failed`, exit `0`. The document and the validated fixtures are therefore the same content.

### Validator (review-time only; validates nothing at runtime)

The validator source is embedded once in the [appendix](#appendix--validator-source-doc-verification-copy) to avoid duplicate drift; it was extracted from there and re-run for the doc-verification pass recorded below.

## Scratch manifest additions

The exact ORM peer and the out-of-band verification client are **declared explicitly**. The pinned closure showed the current repository relies on pnpm's automatic peer installation for `@prisma/orm-postgres`; the probe must not inherit that implicitness. `pg@8.22.0` is the version already resolved transitively in the baseline lockfile (via the CLI dependency graph), pinned here because the runtime uses it for the separate, local-only mutation connection.

```json
{
  "dependencies": {
    "@prisma/orm-postgres": "8.0.0-rc.17",
    "pg": "8.22.0"
  }
}
```

The remaining baseline manifest, workspace policy (`strictDepBuilds`, `allowBuilds: esbuild, workerd`) and Effect RC overrides stay untouched inside the probe; the probe-owned lockfile is generated by the install below and recorded by hash. It is never committed back to StackParity.

## prepare.sh — materialization specification

Runs inside the reviewed `prepare` service only (network available for the registry; no emulators started). Contract emission and migration authoring are file-generation steps; nothing is applied and nothing listens. Every failure stops the script (`set -eu`) and must be recorded, never improvised around.

```sh
#!/bin/sh
# B1-D Phase B scratch preparation — review fixture, NOT executed in PR #5.
# Runs inside the reviewed `prepare` service (see B1-phase-b-isolation-plan.md):
# /workspace is the task-owned volume, /input/baseline.tar is the read-only
# archive of remote main eab6b2a85d46548fa3df3403c82c333d336e3bc6.
# Responsibilities: extraction, explicit manifest additions, probe-owned
# lockfile install, offline contract emission, migration authoring with the
# pinned CLI. This script never starts emulators, never applies migrations
# and never deploys; runtime-only work belongs to the runtime service.

set -eu

: "${PRISMA_COMPOSER_EMULATORS_DIR:?must be set by the reviewed Compose fixture}"
: "${HOME:?must be redirected into the task-owned volume}"

# 0) Toolchain provenance — recorded evidence; bun presence is a pinned
#    closure requirement for the compute daemon (it resolves bun from PATH).
node --version
pnpm --version
bun --version

PROBE=/workspace/probe
rm -rf "$PROBE"
mkdir -p "$PROBE"
tar -xf /input/baseline.tar -C "$PROBE"
cd "$PROBE"

# 1) Manifest additions: the exact ORM peer and the out-of-band verification
#    client are declared explicitly, never relied on as implicit peers.
node -e '
  const fs = require("fs");
  const add = JSON.parse(fs.readFileSync("/input/manifest-additions.json", "utf8"));
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.dependencies = { ...pkg.dependencies, ...add.dependencies };
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

# 2) Install with a probe-owned lockfile. The manifest changed on purpose
#    inside the disposable volume; StackParity's committed lockfile, manifests
#    and working tree are untouched.
pnpm install --reporter=append-only
pnpm why @prisma/dev || true
pnpm why @prisma/orm-postgres || true
sha256sum pnpm-lock.yaml

# 3) Offline contract emission from the probe PSL (no database, no deploy).
pnpm exec prisma contract emit --config prisma.config.ts
sha256sum probe/contract.json probe/contract.d.ts

# 4) Migration authoring with the pinned CLI — file generation only; the
#    surface check runs first because exact flags were only help-observed in
#    Phase A. A failure here stops preparation (fail-closed), to be recorded
#    as evidence, never improvised around.
pnpm exec prisma migration new --help
pnpm exec prisma migration new
find migrations -maxdepth 3 -type f -print
sha256sum migrations/snapshots/*/contract.json 2>/dev/null || true

printf '\nB1_SCRATCH_PREPARED\n'
```

Notes and restrictions recorded for review:

- The `rm -rf "$PROBE"` guard is scoped to the probe directory inside the task-owned volume and exists only for idempotent re-preparation; it can never reach host paths or other projects' resources.
- `pnpm exec prisma migration new` is invoked **after** an explicit `--help` surface check because Phase A only observed the subcommand list; exact flags are confirmed at execution time. A failure here is `BLOCKED` evidence, not a reason to hand-author migration files: the migration triplet's `to` / `migrationHash` fields and the `migrations/snapshots/<hash>/` folder name are CLI-computed content hashes (verified against the upstream example's migration format: `migration.json`, `migration.ts`, `ops.json` + snapshot `contract.json` / `contract.d.ts`), which cannot be produced reliably outside the CLI.
- **Mimosa advisory (non-blocking, reviewed):** a repository security hook flagged the inline `node -e` block as possible command injection. Disposition: the node program is a fixed single-quoted string with no variable interpolation; its inputs are the fixture-mounted JSON and the extracted baseline manifest, both inside the task-owned container; the script is never executed by the product, CI or any untrusted context. Accepted with this rationale; no code path changed.

## Probe fixtures (transformation of the tagged orm-demo)

### probe/module.ts — unique probe identity

```ts
// use prisma-8
//
// B1-D Phase B runtime probe module. Disposable compatibility fixture: one
// Postgres resource typed by the probe contract and one read-only compute
// service. The identity is task-unique so shared local emulators never
// collide with the original app identity (see B1-phase-b-isolation-plan.md).
// The database provision id is "database" (not "db"): the prisma-cloud target
// passes it through as the Prisma resource name, and the Connection API
// rejects names shorter than 3 characters.
import { module } from '@prisma/composer';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import { probeContract } from './probe/contract.ts';
import probeReadService from './probe/service.ts';

export default module('stack-parity-b1-runtime-20261025', ({ provision }) => {
  const db = provision(
    postgres({ name: 'database', contract: probeContract, config: './prisma.config.ts' }),
    { id: 'database' },
  );
  provision(probeReadService, { id: 'proberead', deps: { db } });
});
```

Deltas from the upstream example: module identity is the task-unique `stack-parity-b1-runtime-20261025` (never `stack-parity`); the service is named `proberead`; files live under `probe/` so the exported baseline tree stays recognizable.

### probe/contract.prisma — disposable read-only result table

```prisma
// use prisma-8
//
// B1-D Phase B probe data contract, authored in PSL. One disposable result
// table — an opaque string id and a name — mirroring the proposed Product
// read shape without implementing Product (see B1-product-read-api-gate.md).
// `prisma contract emit` turns this into contract.json (data the runtime
// reads) and contract.d.ts (the branded types the service's typed client
// flows from). Rows are seeded out-of-band by the reviewed runtime procedure;
// no ids are generated here.
model ProbeResult {
  id String @id
  name String

  @@map("ProbeResult")
}
```

Deltas: `id` carries **no** client-side default — the probe seeds explicit deterministic ids out-of-band (the demo generates uuids in the client); the table mirrors the proposed `{ id, name }` Product read shape without implementing Product.

### probe/contract.ts — data contract hydration

```ts
// Hydrates the emitted probe contract. The single value serves both ends:
// the resource side via postgres({ contract, config }) in module.ts and the
// dependency side via postgres(probeContract) in the service. The type is
// passed explicitly because a JSON import's inferred type would be plain
// data rather than the branded type (PSL-first authoring mode).
import { dataContract } from '@prisma/composer-prisma-cloud/orm';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

export const probeContract = dataContract<Contract>(contractJson);
```

### probe/service.ts — one compute service, one Postgres binding

```ts
// One compute service with one dependency: the probe Postgres binding. The
// binding carries the connection URL and the lazily-built typed ORM client,
// injected at hydrate (no-globals); nothing here reads a connection string.
// The build target stays inside probe/ so probe output never mixes with the
// exported baseline tree.
import node from '@prisma/composer/node';
import { compute } from '@prisma/composer-prisma-cloud';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import { probeContract } from './contract.ts';

export default compute({
  name: 'proberead',
  deps: {
    db: postgres(probeContract),
  },
  build: node({ module: import.meta.url, entry: './dist/server.mjs' }),
});
```

Deltas: the build target is `./dist/server.mjs` relative to `probe/`, keeping probe output inside the probe subtree.

### probe/server.ts — loopback-only read-only handler

```ts
// Probe entry mirroring the B0 standalone seam: imports the service surface
// and starts a loopback-only Bun server. Read-only by construction — no row
// mutation exists anywhere in this app; the persistence and mutation proofs
// are performed out-of-band through a separate local database connection by
// the reviewed runtime procedure. A failed query is a 503, never fabricated
// data and never an empty success.
import service from './service.ts';

const { db, port } = await service.load();

const handler = async (): Promise<Response> => {
  try {
    const all = await db.client.orm.public.ProbeResult.all();
    const rows = all
      .map((row) => ({ id: row.id, name: row.name }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return Response.json({ ok: true, results: rows });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
};

Bun.serve({ port, hostname: '127.0.0.1', fetch: handler });
```

Deltas from the demo: no create/write exists anywhere in the probe app; the handler orders rows by `id` (matching the proposed internal ordering rule) and maps failures to a 503 — a failing database read must never be reported as an empty success. Unlike the demo, this seam starts the server on `127.0.0.1` only.

### prisma.config.ts — baseline config + ORM section

```ts
import { defineConfig as composer } from '@prisma/composer/config';
import { nodeBuild } from '@prisma/composer/node/control';
import { prismaCloud, prismaState } from '@prisma/composer-prisma-cloud/control';
import { defineConfig as orm } from '@prisma/orm-postgres/config';
import { definePrismaConfig } from 'prisma/config';

// Baseline StackParity configuration extended with the ORM section required
// by the Phase B probe (see B1-phase-b-scratch-preparation-20261025.md).
// The ORM config anchors the probe contract source and the migrations
// directory; the deploy lowering loads it by path — the app build never
// imports it. The connection is a placeholder: the framework injects the
// real URL at hydrate (no-globals), so nothing reads it. This file exists
// only inside the disposable probe volume; the repository copy stays
// unchanged.
export default definePrismaConfig({
  composer: composer({
    extensions: [prismaCloud({ region: 'eu-central-1' }), nodeBuild()],
    state: prismaState(),
  }),
  orm: orm({
    contract: './probe/contract.prisma',
    db: { connection: 'postgres://localhost:5432/placeholder' },
  }),
});
```

Deltas: only the `orm` section and its import are added to the baseline configuration; the composer extensions, region and state block are unchanged. The connection value is the demo's documented placeholder — the framework injects the real URL at hydrate (no-globals).

## Required Compose fixture amendment

The isolation plan's `prepare` service currently mounts `baseline.tar` and `prepare.sh` read-only. Preparation additionally requires:

```yaml
      - ./manifest-additions.json:/input/manifest-additions.json:ro
      - ./probe-fixtures.tar:/input/probe-fixtures.tar:ro
```

**Runtime-readiness correction (2026-10-25, before execution):** the first execution-readiness check caught a materialization gap — `prepare.sh` extracted the baseline but never overlaid the probe fixtures, so the probe contract/module could not exist in the scratch. Caught test-first (boundary checker `30/1`, fixture validator `55/1`, both exit 1) and fixed: `prepare.sh` now overlays `/input/probe-fixtures.tar` (generated at task setup from `prisma.config.ts` + `probe/`), and the second mount above was added. Re-validated green: boundary checker `31/0`, fixture validator `56/0`. This amendment must appear in the ownership review's resolved-config inspection before any execution.

## Open points carried into the ownership review / runtime

1. Whether `prisma dev` applies the authored migrations during local bootstrap, or an explicit apply step is needed — record observed behavior; if explicit, run the apply **inside** the runtime container against the loopback endpoint and never print the URL.
2. Seed and out-of-band mutation mechanism: connect with the declared `pg` client to the local dev server's database endpoint as published in the state root's `server.json` (`exports.database`), inside the container; URLs and state paths stay unprinted.
3. The runtime's empty-table, seeded-read, changed-read and unavailable-DB sequence remains defined by the isolation plan's runtime acceptance step; this document adds no new acceptance claims.
4. `service.load()` binding shape (`db`, `port`) and `db.client.orm.public.ProbeResult.all()` are taken from the tagged demo source; any drift fails at runtime and is recorded, not patched opportunistically.

## Disposition

- `LOCAL_TOOLCHAIN_PASS`: unchanged. `LOCAL_DB_PASS`: NOT RUN. D-B1-01..03 remain open.
- This review completes isolation-plan review-sequence step 2 at specification level. Next: step 3 (ownership review — resolved-config inspection, resource inventories, mount verification including `bun` on `PATH`), then separately authorized runtime acceptance.

## Appendix — validator source (doc-verification copy)

```sh
#!/bin/sh
# B1-D Phase B scratch-preparation fixture validator (review-time only).
# Usage: sh validate-fixtures.sh <fixture-dir>
# Static assertions on the REVIEW FIXTURES only. Validates nothing at runtime.
set -u
FIX="$1"
FAILS=0
PASSES=0

ok()   { PASSES=$((PASSES+1)); }
bad()  { FAILS=$((FAILS+1)); printf 'FAIL: %s\n' "$1"; }

# has <file> <fixed-string-fragment>
has() {
  f="$FIX/$1"; frag="$2"
  if [ ! -f "$f" ]; then bad "$1: missing file"; return; fi
  if grep -qF -- "$frag" "$f"; then ok; else bad "$1: missing fragment: $frag"; fi
}
# lacks <file> <fixed-string-fragment>
lacks() {
  f="$FIX/$1"; frag="$2"
  if [ ! -f "$f" ]; then bad "$1: missing file"; return; fi
  if grep -qF -- "$frag" "$f"; then bad "$1: forbidden fragment present: $frag"; else ok; fi
}
# firstline <file> <fixed-string>
firstline() {
  f="$FIX/$1"; frag="$2"
  if [ ! -f "$f" ]; then bad "$1: missing file"; return; fi
  if [ "$(head -n 1 "$f")" = "$frag" ]; then ok; else bad "$1: first line is not: $frag"; fi
}

echo "== fixture dir: $FIX =="

## prepare.sh — materialization script boundaries
if [ -f "$FIX/prepare.sh" ]; then
  if sh -n "$FIX/prepare.sh" 2>/dev/null; then ok; else bad "prepare.sh: sh syntax check failed"; fi
else
  bad "prepare.sh: missing file"
fi
has prepare.sh 'set -eu'
has prepare.sh 'baseline.tar'
has prepare.sh 'pnpm install'
has prepare.sh 'contract emit'
has prepare.sh 'migration new'
has prepare.sh 'PRISMA_COMPOSER_EMULATORS_DIR'
lacks prepare.sh '--fresh'
lacks prepare.sh 'prisma dev'
lacks prepare.sh 'db migrate'
lacks prepare.sh 'prisma deploy'
lacks prepare.sh 'down -v'

## manifest-additions.json — exact pinned dependency additions
if [ -f "$FIX/manifest-additions.json" ]; then
  node -e '
    const fs = require("fs");
    const path = require("path");
    const m = JSON.parse(fs.readFileSync(path.resolve(process.argv[1], "manifest-additions.json"), "utf8"));
    const bad = (msg) => { console.error("FAIL: manifest-additions.json: " + msg); process.exit(1); };
    if (m.dependencies["@prisma/orm-postgres"] !== "8.0.0-rc.17") bad("orm-postgres must be exactly 8.0.0-rc.17");
    if (m.dependencies.pg !== "8.22.0") bad("pg must be exactly 8.22.0");
    const extra = Object.keys(m.dependencies).filter((k) => k !== "@prisma/orm-postgres" && k !== "pg");
    if (extra.length) bad("unexpected additional dependencies: " + extra.join(","));
    console.log("PASS: manifest-additions.json structure");
  ' "$FIX" && ok || bad "manifest-additions.json: structure check failed"
else
  bad "manifest-additions.json: missing file"
fi

## probe/module.ts — unique probe identity, one database + one service
has probe/module.ts "module('stack-parity-b1-runtime-20261025'"
lacks probe/module.ts "module('stack-parity'"
lacks probe/module.ts 'module("stack-parity"'
has probe/module.ts "from '@prisma/composer-prisma-cloud/orm'"
has probe/module.ts "postgres({ name: 'database'"
has probe/module.ts "id: 'database'"
has probe/module.ts "config: './prisma.config.ts'"
has probe/module.ts 'deps: { db }'
has probe/module.ts "from './probe/contract.ts'"
has probe/module.ts "from './probe/service.ts'"

## probe/contract.prisma — PSL-first probe table
firstline probe/contract.prisma '// use prisma-8'
has probe/contract.prisma 'model ProbeResult'
has probe/contract.prisma 'id String @id'
has probe/contract.prisma 'name String'
lacks probe/contract.prisma 'datasource'
lacks probe/contract.prisma 'generator'

## probe/contract.ts — data contract hydration
has probe/contract.ts 'dataContract<Contract>(contractJson)'
has probe/contract.ts "from '@prisma/composer-prisma-cloud/orm'"
has probe/contract.ts "'./contract.json' with { type: 'json' }"
has probe/contract.ts "'./contract.d.ts'"

## probe/service.ts — one compute service, read-only binding
has probe/service.ts "import node from '@prisma/composer/node'"
has probe/service.ts "import { compute } from '@prisma/composer-prisma-cloud'"
has probe/service.ts "import { postgres } from '@prisma/composer-prisma-cloud/orm'"
has probe/service.ts 'export default compute({'
has probe/service.ts "name: 'proberead'"
has probe/service.ts 'db: postgres(probeContract)'
has probe/service.ts "entry: './dist/server.mjs'"
lacks probe/service.ts '.create('

## probe/server.ts — loopback read-only handler
has probe/server.ts 'Bun.serve({'
has probe/server.ts "hostname: '127.0.0.1'"
has probe/server.ts 'db.client.orm.public.ProbeResult.all()'
has probe/server.ts 'Response.json('
has probe/server.ts '503'
lacks probe/server.ts '.create('
lacks probe/server.ts 'INSERT'
lacks probe/server.ts 'UPDATE'
lacks probe/server.ts 'DELETE'

## prisma.config.ts — baseline composer config + orm section, no credentials
has prisma.config.ts "import { defineConfig as orm } from '@prisma/orm-postgres/config'"
has prisma.config.ts 'orm: orm({'
has prisma.config.ts "contract: './probe/contract.prisma'"
has prisma.config.ts "'postgres://localhost:5432/placeholder'"
if [ -f "$FIX/prisma.config.ts" ]; then
  if grep -qE '://[^/]*@' "$FIX/prisma.config.ts"; then bad 'prisma.config.ts: URL with credentials'; else ok; fi
fi

echo "== summary: $PASSES passed, $FAILS failed =="
if [ "$FAILS" -gt 0 ]; then
  printf 'SCRATCH_FIXTURE_VALIDATION_FAIL\n'
  exit 1
fi
printf 'SCRATCH_FIXTURE_VALIDATION_PASS\n'
```
