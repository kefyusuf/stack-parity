# SPIKE-001 — Docker development (Windows/macOS/Linux)

**Status: FIX PREPARED — not container-validated by the assistant.**
**Scope:** A single local Linux toolchain and Hono endpoint. No production Docker deployment or database.

## Why this workflow exists

Local development must work without a host installation of Node.js, Bun, or pnpm. Docker Desktop/Engine with Compose v2 is enough.

A previous version of this configuration had two usability/performance problems:

1. `docker compose up dev` executed `pnpm --version` and **did not launch HTTP**.
2. pnpm's store defaulted to `/workspace/.pnpm-store`, which is a Windows bind mount when using Docker Desktop. This can make the large install noticeably slower.

This revision gives `docker compose up -d dev` one clear purpose: **run the Hono HTTP server**, and puts the pnpm store in the `workspace_node_modules` named Linux volume.

## Cleanly finish the installation first

Run these commands **from the repository root**:

```powershell
docker compose build dev
docker compose run --rm dev pnpm install --reporter=append-only
```

The first installation can take time and produce `deprecated subdependencies` warnings from transitive packages. Such warnings are **not themselves failures**. A transient `ERR_PNPM_ENODATA` retry also does not conclusively indicate failure; let the command finish and check its exit status.

**Do not run typecheck, tests, or build before install exits successfully.** If the installation is interrupted (Ctrl+C), later pnpm commands can attempt dependency installation again. A completed install must return to the prompt and end successfully. It should generate `pnpm-lock.yaml`, which we must commit after verification.

To confirm that the container resolves its store on the volume:

```powershell
docker compose run --rm dev pnpm store path
```

Expected base path begins with `/workspace/node_modules/.pnpm-store/`, not `/workspace/.pnpm-store/`.

## Verify locally, without Composer or cloud access

```powershell
docker compose run --rm dev pnpm typecheck
docker compose run --rm dev pnpm test
docker compose run --rm dev pnpm build
```

Only after those commands succeed:

```powershell
docker compose up -d dev
docker compose ps
docker compose logs --tail=100 dev
```

Verify the stable published port from **PowerShell**:

```powershell
curl.exe -i http://localhost:3000/health
```

Expected HTTP 200 and JSON:

```json
{"status":"ok","contractVersion":"spike-001"}
```

The HTTP service is available as long as `docker compose up` has its `dev` container running.

## Troubleshooting

- If `docker compose ps` shows `Exited`, inspect `docker compose logs dev`.
- If `curl.exe` reports a connection failure, ensure the install command succeeded and the `dev` process is running.
- If pnpm starts resolving hundreds of dependencies during `pnpm test` or `pnpm build`, the prior install did not complete; stop and finish `pnpm install` first.
- Deprecated dependency warnings are informational; do not upgrade unrelated packages simply to suppress them.
- On Windows, invoke `curl.exe` to avoid PowerShell's `curl` alias behavior.
- The initial install must reach the npm registry. Do not run `docker compose down -v` merely to retry: it erases the named dependency volumes and forces a fresh install.
- If the old bind-mounted `.pnpm-store` exists on the host, it can be removed **only after** verifying it contains no user data and is untracked. Do not delete node_modules volumes as the first response.

## Stop and cleanup

```powershell
docker compose down
```

Keep named volumes; do not use `-v` unless deliberately resetting dependencies.

## Verification boundary

The standalone Hono runner imports the same Hono app as the Compute entrypoint, but it bypasses the Composer provisioning path. Passing this local test does **not** prove `prisma dev`, deployment or public HTTP behavior. SPIKE-001 stays open until the separate Compute gate passes.
