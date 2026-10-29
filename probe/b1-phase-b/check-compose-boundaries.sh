#!/bin/sh
# B1-D Phase B ownership-review boundary checker (review-time only).
# Usage: sh check-compose-boundaries.sh <compose-file> <work-dir>
# Runs `docker compose config --format json` (creates NO Docker resources)
# and asserts the reviewed isolation boundaries on the resolved model.
set -u
COMPOSE="$1"
WORK="$2"
FAILS=0
PASSES=0

ok()  { PASSES=$((PASSES+1)); printf 'PASS: %s\n' "$1"; }
bad() { FAILS=$((FAILS+1)); printf 'FAIL: %s\n' "$1"; }

mkdir -p "$WORK"

# Live-image provenance: the Compose fixture references the toolchain by tag
# with pull_policy never; the pinned image ID is verified here instead, so a
# silently retagged image fails this check before any launch.
IMAGE_TAG='stackparity-b1-probe-dev:latest'
IMAGE_SHA='2ea151b932088e8f9d5c80ec3fac1ffa3e2627fd8c7277b56db0f8606eccec45'
LIVE_ID="$(docker image inspect "$IMAGE_TAG" --format '{{.Id}}' 2>/dev/null || true)"
if [ "$LIVE_ID" = "sha256:$IMAGE_SHA" ]; then
  ok "live image $IMAGE_TAG resolves to the reviewed sha256:$IMAGE_SHA"
else
  bad "live image $IMAGE_TAG mismatch: ${LIVE_ID:-missing}"
fi
LIVE_USER="$(docker image inspect "$IMAGE_TAG" --format '{{.Config.User}}' 2>/dev/null || true)"
if [ "$LIVE_USER" = "node" ]; then
  ok "live image effective user is node"
else
  bad "live image user: ${LIVE_USER:-missing}"
fi

if docker compose -f "$COMPOSE" config --format json > "$WORK/resolved.json" 2>"$WORK/config.err"; then
  ok "compose config resolved"
else
  bad "compose config failed: $(tr '\n' ' ' < "$WORK/config.err")"
  printf '== summary: %s passed, %s failed ==\nCOMPOSE_BOUNDARY_CHECK_FAIL\n' "$PASSES" "$FAILS"
  exit 1
fi

node - "$WORK/resolved.json" <<'NODE_EOF'
const fs = require('fs');
const c = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let passes = 0, fails = 0;
const out = {
  ok: (m) => { passes++; console.log('PASS: ' + m); },
  bad: (m) => { fails++; console.log('FAIL: ' + m); },
};

const SHA = '2ea151b932088e8f9d5c80ec3fac1ffa3e2627fd8c7277b56db0f8606eccec45';
const IMAGE_TAG = 'stackparity-b1-probe-dev:latest';
const S = c.services || {};
const names = Object.keys(S).sort();
if (JSON.stringify(names) === JSON.stringify(['prepare', 'runtime'])) out.ok('exactly two services: prepare, runtime');
else out.bad('unexpected services: ' + names.join(','));

const expectedEnv = {
  HOME: '/workspace/home',
  XDG_CONFIG_HOME: '/workspace/home/.config',
  XDG_CACHE_HOME: '/workspace/home/.cache',
  XDG_DATA_HOME: '/workspace/home/.local/share',
  XDG_STATE_HOME: '/workspace/home/.local/state',
  TMPDIR: '/workspace/tmp',
  PNPM_CONFIG_STORE_DIR: '/workspace/node_modules/.pnpm-store',
  PRISMA_COMPOSER_EMULATORS_DIR: '/workspace/state/emulators',
};

for (const n of names) {
  const s = S[n];
  if (s.image === IMAGE_TAG) out.ok(n + ': image is the reviewed toolchain tag (pull_policy never)');
  else out.bad(n + ': unexpected image reference: ' + s.image);
  if (s.user === 'node') out.ok(n + ': user node');
  else out.bad(n + ': unexpected user: ' + s.user);
  if (!s.ports || s.ports.length === 0) out.ok(n + ': no published ports');
  else out.bad(n + ': publishes ports');
  if (s.privileged !== true) out.ok(n + ': not privileged');
  else out.bad(n + ': privileged mode');
  if (s.pid !== 'host') out.ok(n + ': no host PID namespace');
  else out.bad(n + ': host PID namespace');
  if (s.ipc !== 'host') out.ok(n + ': no host IPC namespace');
  else out.bad(n + ': host IPC namespace');
  if ((s.pull_policy || '') === 'never') out.ok(n + ': pull_policy never (local image only)');
  else out.bad(n + ': pull_policy: ' + s.pull_policy);

  const env = s.environment || {};
  const envKeys = Object.keys(expectedEnv);
  const envMismatch = envKeys.filter((k) => env[k] !== expectedEnv[k]);
  if (envMismatch.length === 0) out.ok(n + ': task-owned HOME/XDG/TMPDIR/store/emulators environment');
  else out.bad(n + ': environment mismatch: ' + envMismatch.join(','));

  const vols = s.volumes || [];
  const socks = vols.filter((v) => /docker\.sock/.test(v.source || ''));
  if (socks.length === 0) out.ok(n + ': no Docker socket mount');
  else out.bad(n + ': Docker socket mounted');

  const binds = vols.filter((v) => v.type === 'bind');
  const named = vols.filter((v) => v.type === 'volume');
  const unro = binds.filter((v) => !v.read_only);
  if (unro.length === 0) out.ok(n + ': all bind mounts read-only');
  else out.bad(n + ': writable bind mounts: ' + unro.map((v) => v.source).join(','));

  if (n === 'prepare') {
    const wantBinds = ['baseline.tar', 'prepare.sh', 'manifest-additions.json', 'probe-fixtures.tar'];
    const gotBinds = binds.map((v) => String(v.source).replace(/\\/g, '/').split('/').pop()).sort();
    if (JSON.stringify(gotBinds) === JSON.stringify([...wantBinds].sort())) out.ok('prepare: exactly the three read-only input mounts');
    else out.bad('prepare: unexpected bind mounts: ' + gotBinds.join(','));
    if (named.length === 1 && named[0].source === 'scratch') out.ok('prepare: single task-owned scratch volume');
    else out.bad('prepare: unexpected volume mounts: ' + named.map((v) => v.source).join(','));
  }
  if (n === 'runtime') {
    if (binds.length === 0) out.ok('runtime: no bind mounts at all');
    else out.bad('runtime: unexpected bind mounts: ' + binds.map((v) => v.source).join(','));
    if (named.length === 1 && named[0].source === 'scratch') out.ok('runtime: single task-owned scratch volume');
    else out.bad('runtime: unexpected volume mounts: ' + named.map((v) => v.source).join(','));
    if (s.network_mode === 'none') out.ok('runtime: network_mode none (offline, loopback-only)');
    else out.bad('runtime: network_mode: ' + s.network_mode);
    if (s.init === true) out.ok('runtime: init true');
    else out.bad('runtime: init: ' + s.init);
    if (s.working_dir === '/workspace/probe') out.ok('runtime: working_dir /workspace/probe');
    else out.bad('runtime: working_dir: ' + s.working_dir);
    const cmd = JSON.stringify(s.command || []);
    if (cmd === JSON.stringify(['pnpm', 'exec', 'prisma', 'dev', 'module.ts'])) out.ok('runtime: command is prisma dev module.ts (scratch-root entry)');
    else out.bad('runtime: unexpected command: ' + cmd);
  }
}

const V = c.volumes || {};
if (V.scratch && V.scratch.external !== true) out.ok('scratch volume is task-owned (not external)');
else out.bad('scratch volume missing or external');

const N = c.networks || {};
const hostNets = Object.values(N).filter((x) => x.external === true || x.name === 'host');
if (!c.services.runtime || (!c.services.runtime.network_mode || c.services.runtime.network_mode === 'none')) {
  if (hostNets.length === 0) out.ok('no external/host networks declared');
  else out.bad('external/host network declared');
}
if (Object.keys(N).length === 0) out.ok('no custom networks (default per-service network only)');
console.log(`== node summary: ${passes} passed, ${fails} failed ==`);
process.exit(fails > 0 ? 1 : 0);
NODE_EOF

NODE_STATUS=$?
if [ "$NODE_STATUS" -eq 0 ] && [ "$FAILS" -eq 0 ]; then
  printf 'COMPOSE_BOUNDARY_CHECK_PASS\n'
  exit 0
fi
printf 'COMPOSE_BOUNDARY_CHECK_FAIL\n'
exit 1
