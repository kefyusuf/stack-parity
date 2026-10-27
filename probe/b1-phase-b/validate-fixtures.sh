#!/bin/sh
# B1-D Phase B scratch-preparation fixture validator (review-time only).
# Usage: sh validate-fixtures.sh <fixture-dir>   (from a task-owned copy)
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
has prepare.sh 'probe-fixtures.tar'
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
