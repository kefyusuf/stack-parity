# SPIKE-001: pnpm/Turborepo Shared Contract → Hono → Prisma Compute

- **Status:** READY / NOT RUN
- **Issue:** #1
- **Type:** Technical feasibility
- **Milestone:** B0

## Question

Can one Hono service living in a pnpm + Turborepo monorepo import a local `@stack-parity/contracts` package, build into a deployable artifact, and return the contract value from a public Prisma Compute URL?

## Minimal design

```text
stack-parity/
├── packages/contracts/      # exports CONTRACT_VERSION and HealthResponse
├── services/public-api/     # only Hono service
├── module.ts                # Prisma Composer root module
├── prisma-composer.config.ts
├── pnpm-workspace.yaml
└── turbo.json
```

The exact Composer files/CLI commands must match the **installed package version** and the current official Prisma documentation.

**Endpoint:** `GET /health`

Expected JSON:

```json
{"status":"ok","contractVersion":"spike-001"}
```

The imported value must originate in `packages/contracts`, via the package export boundary, and be observable in the final HTTP response.

## Acceptance criteria

- **AC-01:** Clean installation from committed `pnpm-lock.yaml`.
- **AC-02:** Service imports the shared workspace package, not a relative source path.
- **AC-03:** Typecheck and build succeed; built artifact includes the required workspace code.
- **AC-04:** Local `GET /health` returns HTTP 200 with expected JSON.
- **AC-05:** Minimal Composer configuration provisions the Hono service only.
- **AC-06:** A real Prisma Compute deployment succeeds.
- **AC-07:** Public deployment `GET /health` returns HTTP 200 with matching JSON.
- **AC-08:** Evidence captures command versions, commands, results, deployed URL, and warnings without secrets.

## Validation sequence

1. Check Node (Composer requires Node 22.18+, prefer stable Node 24), Bun, pnpm and Prisma CLI availability.
2. Resolve dependencies and commit a clean lockfile.
3. Synchronize the Composer agent skill from the installed version where applicable.
4. Typecheck and build.
5. Run locally with `prisma dev module.ts`; request `/health`.
6. Verify credentials with `prisma auth whoami`. If necessary, the human operator runs interactive `prisma auth login`.
7. Select/configure an officially supported Compute region; record why it was chosen.
8. Deploy with `prisma deploy module.ts`; request the printed public service URL's `/health`.
9. Record evidence, assign PASS / BLOCKED / FAIL, and only then authorize the next milestone.

Prisma Composer deployment consumes our build artifact: `deploy` is **not** a substitute for a successful build.

## Stop conditions

- Missing interactive Prisma authentication: BLOCKED.
- Build/runtime incompatibility: document reproducer, do not add a second framework.
- Compute region/quota/plan limitation: BLOCKED or FAIL with evidence.
- No public reachable URL: do not call PASS.
- Successful local check alone: **insufficient** for PASS.

## Explicitly excluded

No database, model migrations, Product/Customer/Order implementation, frontend apps, NestJS, API versioning, benchmarks, additional platforms, CI deploy automation or sponsor assets.

## Next only after PASS

First Product vertical slice: contract → persistence → `GET /products` → test → deploy.
