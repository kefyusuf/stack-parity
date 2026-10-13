# StackParity

**One product. Many stacks. One contract.**

StackParity is an open-source, production-shaped reference project exploring how distinct TypeScript stacks can coexist within one product through stable contracts and independently verifiable deployment boundaries.

> **Status: B0 complete; B1 definition/review only.** SPIKE-001 passed on an isolated Prisma Compute stage (2026-10-13), and PR #3 was merged. No production application or Product feature has been deployed.

## Current objective

Prove a single, narrow technical seam:

`pnpm workspace → shared contracts package → Hono service → Prisma Compute`

This is **SPIKE-001**. That requirement passed: the public Compute stage returned HTTP 200 and `{"status":"ok","contractVersion":"spike-001"}` from `GET /health`. See the [SPIKE-001 execution evidence](docs/spikes/SPIKE-001-execution.md).

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
