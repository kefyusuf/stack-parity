# B1-D Toolchain Preflight — 2026-10-25

**Result: `LOCAL_TOOLCHAIN_PASS`. Phase B / `LOCAL_DB_PASS`: NOT RUN.**

Scope: close the pending B0 baseline uncached-build check in [the B1 definition gate](B1-product-read-api-gate.md). This is planning evidence, not Product implementation or database compatibility proof.

## Provenance and isolation

- GitHub PR #3 was merged and Issue #1 closed; PR #5 remains Draft. Remote refs were checked using `git ls-remote origin refs/heads/main refs/heads/docs/b1-planning-gate`.
- Source: immutable `main` commit `eab6b2a85d46548fa3df3403c82c333d336e3bc6`, exported with `git archive`. No `.git`, credentials, ignored state or local dependency directories were copied.
- Archive SHA-256: `86fd920562008c3f9b7062befacc5e9787aa395f7ceb1f0877f7fd923d5a81fc`.
- Reused existing development image `stackparity-b1-probe-dev:latest` by immutable local image ID `sha256:1af3cd0f9671b746f49dfa7b624228c5b1441efcd3a98bdec48267cde4a2e9d5`. The image was not rebuilt; these results do not prove a fresh image build.
- Docker Engine `29.9.2`; project `stack-parity-b1-preflight-20261025`. Initial label-filtered volume/network inventories were empty.
- A read-only archive and script were mounted from temporary `.tmp-b1-preflight-20261025/` files. Extraction, package installation and generated output stayed in a new `/workspace` volume, outside the repository checkout. No host ports, Docker socket, credential mounts or existing project volumes were exposed.
- Sandbox-temporary files were unavailable to the elevated Docker process on the first preparation attempt. Compose validation failed before any resource creation. Temporary input files were then prepared under the repository and removed after verification; no product configuration changed.

## Exact execution

From `E:\projects\stack-parity`, with `$taskDir` set to `E:\projects\stack-parity\.tmp-b1-preflight-20261025`:

```powershell
git archive --format=tar --output="$taskDir\baseline.tar" eab6b2a85d46548fa3df3403c82c333d336e3bc6
docker compose -p stack-parity-b1-preflight-20261025 -f "$taskDir\compose.yaml" config --quiet
docker compose -p stack-parity-b1-preflight-20261025 -f "$taskDir\compose.yaml" run --rm --no-deps check
```

The run's stdout/stderr was captured with `Tee-Object`; PowerShell captured `PREFLIGHT_EXIT=0`. Compose configuration validation also exited `0`. The temporary Compose file contained:

```yaml
services:
  check:
    image: sha256:1af3cd0f9671b746f49dfa7b624228c5b1441efcd3a98bdec48267cde4a2e9d5
    pull_policy: never
    init: true
    working_dir: /workspace
    environment:
      PNPM_CONFIG_STORE_DIR: /workspace/node_modules/.pnpm-store
      TURBO_TELEMETRY_DISABLED: '1'
    command: [sh, /input/check.sh]
    volumes:
      - ./baseline.tar:/input/baseline.tar:ro
      - ./check.sh:/input/check.sh:ro
      - scratch:/workspace
volumes:
  scratch:
```

The complete sequential check script was:

```sh
set -eu
cd /workspace
tar -xf /input/baseline.tar
sha256sum package.json pnpm-lock.yaml pnpm-workspace.yaml > /tmp/baseline.sha256
node --version
pnpm --version
bun --version
git --version
pnpm install --frozen-lockfile --reporter=append-only
pnpm exec prisma --version
pnpm exec prisma contract --help
pnpm exec prisma migration --help
pnpm exec prisma contract emit --help
pnpm exec prisma db migrate --help
pnpm typecheck
pnpm test
pnpm exec turbo run build --force
test -s services/public-api/dist/server.mjs
sha256sum -c /tmp/baseline.sha256
printf '\nB1_BASELINE_PREFLIGHT_PASS\n'
```

With `set -e`, a failed command would stop the sequence. The final marker and Compose exit `0` establish that every listed command succeeded; individual numeric exit codes were not printed separately.

## Observed results

| Check | Result |
| --- | --- |
| Runtime versions | Node `v24.21.0`, pnpm `11.28.5`, Bun `1.4.3`, Git `2.39.5` |
| Frozen install | `433` packages; `Done in 27.6s using pnpm v11.28.5`; existing lockfile accepted |
| Installed baseline | Composer / Cloud extension `0.29.1`; Prisma CLI `8.0.0-rc.22`; TypeScript `7.0.2`; Turbo `2.11.2` |
| Prisma version | JSON result `ok: true`, `version: 8.0.0-rc.22`, `exitCode: 0` |
| Contract/migration help | Top-level contract and migration help, `contract emit --help`, `db migrate --help` succeeded; only help was requested |
| Typecheck | `tsc -p tsconfig.json --noEmit`, no diagnostics |
| Health unit test | `1 pass`, `0 fail`, `2 expect() calls`; no network listener started |
| Forced build | `cache bypass, force executing`; bundled `161` modules; `server.mjs 0.36 MB`; `1 successful, 1 total`, `0 cached, 1 total` |
| Artifact | `test -s services/public-api/dist/server.mjs` succeeded |
| Input integrity | `package.json: OK`, `pnpm-lock.yaml: OK`, `pnpm-workspace.yaml: OK` |

Warnings: a slow registry download did not prevent installation; pnpm advertised an update, which was not applied. Prisma help printed the existing unsynchronized agent-skills advisory mentioning ORM `8.0.0-rc.17`. No skill installation/synchronization occurred; the advisory is not an ORM database test.

## Cleanup and remaining boundary

After the one-off container exited, `docker compose ... ps --all` showed no containers. `docker volume inspect` and `docker network inspect` confirmed that the created resources carried this task's exact Compose project label. Then:

```powershell
docker compose -p stack-parity-b1-preflight-20261025 -f "$taskDir\compose.yaml" down --volumes --remove-orphans
```

Cleanup exited `0`. Label-filtered container, volume and network inventories were empty afterwards. Only the task-created `stack-parity-b1-preflight-20261025_scratch` volume and `stack-parity-b1-preflight-20261025_default` network were removed. Existing images, the main development stack and older probe resources were retained.

No Product code, new dependency, data contract emission, migration, database, Composer emulator, cloud deploy or cloud teardown was executed. PR #5 remains documentation-only. D-B1-01 requires the real Phase B ORM/Postgres probe; D-B1-02 and D-B1-03 still require review. Before Phase B, review concrete module/emulator/DB isolation, listener binding and ownership-checked cleanup. B1 implementation and any cloud operation retain their separate approval gates.
