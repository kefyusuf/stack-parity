# SPIKE-001 — Optional Docker development path

**Status:** PREPARED, NOT EXECUTED

This is an alternative to installing Node.js, Bun, and pnpm on the host. The only required host tools are Docker Engine/Desktop with Compose v2.

## Prepare and validate

From the repository root:

```sh
docker compose build dev
docker compose run --rm dev pnpm install
docker compose run --rm dev pnpm typecheck
docker compose run --rm dev pnpm test
docker compose run --rm dev pnpm build
```

These commands run in the Linux container and use named volumes for `node_modules`, so native host modules are not mixed with container binaries. The working tree is bind-mounted; a generated `pnpm-lock.yaml` appears in the repository and **must be committed** before the spike can pass. Subsequent clean runs should use `pnpm install --frozen-lockfile`.

## Run the health endpoint

After installing dependencies:

```sh
docker compose run --rm --service-ports dev pnpm --filter @stack-parity/public-api dev:standalone
```

In a second terminal on the host:

```sh
curl -i http://localhost:3000/health
```

Expected HTTP 200 body:

```json
{"status":"ok","contractVersion":"spike-001"}
```

Shut down the process with Ctrl+C. Use `docker compose down` to remove Compose's containers and network. Do **not** pass `-v` unless you intend to erase cached workspace dependencies.

## Boundaries and risks

- Docker here is **not** a deployment target, a production image, or an alternative database.
- The standalone local runner exercises the same Hono `app.fetch` but does **not** exercise Composer's service provisioner or runtime wiring.
- This does not prove `prisma dev`, `prisma deploy`, cloud authentication, or Prisma Compute compatibility. Those remain independent gates in [SPIKE-001-execution.md](SPIKE-001-execution.md).
- No host Docker socket is mounted into the container; no privileged containers or Docker-in-Docker.
- Do not enter cloud secrets into shell commands that would be committed to the repository.
- Network access is required during the first image build and dependency installation.
- Docker Desktop on Windows can run the Linux toolchain path. For Composer's full local `dev` behavior, use a supported Linux environment and follow the installed-version documentation.
- On Linux hosts with a non-default user ID, bind-mounted lockfile permissions may require adjustment. Do not run `chmod -R 777` as a workaround.

## Acceptance boundary

An HTTP 200 response from this container is a **local smoke check only**. SPIKE-001 remains unverified until actual remote deployment and its publicly reachable `/health` response have been recorded.
