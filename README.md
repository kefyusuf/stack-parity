# StackParity

**One product. Many stacks. One contract.**

StackParity is an open-source, production-shaped reference project exploring how distinct TypeScript stacks can coexist within one product through stable contracts and independently verifiable deployment boundaries.

> **Status: B1 / First Product read slice (in review).** SPIKE-001 passed on an isolated Prisma Compute stage (2026-10-13). The B1 definition gate closed on 2026-10-27; the first Product read slice is implemented and locally verified against a real disposable Postgres. Cloud deployment of the slice remains pending a separate approval.

## Current objective

Prove a single, narrow technical seam:

`pnpm workspace → shared contracts package → Hono service → Prisma Compute`

This is **SPIKE-001**. That requirement passed: the public Compute stage returned HTTP 200 and `{"status":"ok","contractVersion":"spike-001"}` from `GET /health`. See the [SPIKE-001 execution evidence](docs/spikes/SPIKE-001-execution.md).

## B1: first Product read slice

The existing Hono service now serves `GET /products` — a database-backed, contract-typed read path over the shared `@stack-parity/contracts` types:

`Prisma Postgres → Hono GET /products → HTTP JSON consumer`

- `GET /health` is unchanged; without a database the standalone runner answers `GET /products` with `503` (fail-closed, no fabricated data).
- The Product table, emitted data contract and attested migration live in `services/public-api`; migrations apply automatically during local Composer bootstrap.
- Deterministic seed: `DATABASE_URL=<connection string> pnpm --filter @stack-parity/public-api seed` (connection string stays outside Git).
- Scope and acceptance: [B1 gate](docs/milestones/B1-product-read-api-gate.md) and the [approved B1-D scope](docs/milestones/B1-d-exit-review-20261027.md). Deploying this graph to any stage requires separate approval (B1-AC-06).

## Intended reference application (not implemented)

Later milestones may add Astro (content), Next.js (storefront), Nuxt (merchant UI), and NestJS (business workflows). Their inclusion depends on independently verified milestones; they are **not** part of B0.

## Principles

- One product, not a collection of unrelated tutorials
- Share contracts, not framework-specific implementations
- Frameworks must earn a real product role
- Evidence before expansion
- Prisma Compute is the initial deployment target, not a permanent lock-in requirement

Read the [B0 Bootstrap Brief](docs/bootstrap-brief-v0.1.md), [SPIKE-001 acceptance gate](docs/spikes/SPIKE-001.md), [ADR-0001](docs/adr/0001-project-thesis-and-boundaries.md), and [Issue #1](https://github.com/kefyusuf/stack-parity/issues/1).

## Local SPIKE-001 development

You can either install Node.js, Bun and pnpm natively or use Docker Desktop / Docker Engine with Compose v2.

For the Docker path, see [SPIKE-001 Docker development](docs/spikes/SPIKE-001-docker.md). It provides local install, typechecking, tests, build and a standalone Hono HTTP smoke check without host language runtimes.

**Boundary:** the standalone Docker smoke check alone is not proof of Prisma Composer or Compute behavior; those separate gates were also verified as documented in [SPIKE-001 execution](docs/spikes/SPIKE-001-execution.md). The deployed stage is for technical verification, not a production release.

## License

[MIT](LICENSE).
