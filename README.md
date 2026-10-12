# StackParity

**One product. Many stacks. One contract.**

StackParity is an open-source, production-shaped reference project exploring how distinct TypeScript stacks can coexist within one product through stable contracts and independently verifiable deployment boundaries.

> **Status: B0 / Bootstrap.** No production application or live deployment exists yet.

## Current objective

Prove a single, narrow technical seam:

`pnpm workspace → shared contracts package → Hono service → Prisma Compute`

This is **SPIKE-001**. A successful deployment requires a live HTTP 200 response from `GET /health` showing a value imported from the shared package.

## Intended reference application (not implemented)

Later milestones may add Astro (content), Next.js (storefront), Nuxt (merchant UI), and NestJS (business workflows). Their inclusion depends on independently verified milestones; they are **not** part of B0.

## Principles

- One product, not a collection of unrelated tutorials
- Share contracts, not framework-specific implementations
- Frameworks must earn a real product role
- Evidence before expansion
- Prisma Compute is the initial deployment target, not a permanent lock-in requirement

See the upcoming bootstrap documentation and SPIKE-001 issue for scope, acceptance criteria, and implementation order.

## License

MIT (to be added through the bootstrap pull request).
