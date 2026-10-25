#!/bin/sh
# B1-D Phase B scratch preparation — reviewed fixture, NOT executed in PR #5.
# Runs inside the reviewed `prepare` service (see probe/b1-phase-b/compose.yaml
# and docs/milestones/B1-phase-b-isolation-plan.md): /workspace is the
# task-owned volume, /input/baseline.tar is the read-only archive of remote
# main eab6b2a85d46548fa3df3403c82c333d336e3bc6.
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
