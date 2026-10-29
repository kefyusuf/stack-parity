# HOLD — Roadmap Candidates, Not Active Scope

This file is an idea inventory, not a commitment or an implementation checklist.

## Planned V0.1 product surfaces (after B0)

- ~~Next.js customer storefront~~ — **REJECTED (2026-10-29, owner decision):** Next.js and any Vercel-developed stack/structure are excluded from this project; see the decision note below.
- Nuxt merchant dashboard
- Astro marketing/docs
- NestJS business workflows
- ~~Prisma Postgres and the first Product API vertical slice~~ — **DONE as B1** (closed 2026-10-29; see `docs/milestones/B1-product-read-api-gate.md`)

Each requires a milestone with acceptance criteria before implementation.

## Decision note — Next.js / Vercel exclusion (2026-10-29)

The owner set a hard red line: **Next.js will not be used, and no Vercel-developed stack or structure is acceptable** ("kırmızı çizgi nextjs olmayacak; vercel geliştirmesi hiçbir yapı kullanmak istemiyorum"). The original bootstrap brief listed a Next.js storefront as design intent only; that intent is now rejected. Future UI-stack proposals must document the absence of Vercel coupling assumptions before gating.

## Current promotion sequence (owner preference, 2026-10-29)

1. **B2 candidate:** read-path deepening on the existing Hono service (`GET /products/:id`, Customer read model) — smallest careful step; consolidates the contract + data patterns any later UI stack will consume. Proposed in `docs/milestones/B2-read-deepening-gate.md`.
2. Astro marketing/docs — second stack, content-focused, low contract coupling.
3. NestJS business workflows — largest scope; requires Customer/Order modeling decisions.

## Additional framework experiments

- Express, Fastify, Elysia, Bun HTTP
- Angular, React/Vite, Vue/Vite, Svelte (and SvelteKit — **verify no Vercel coupling assumptions** before any proposal)
- TanStack Start
- Additional ORM/data clients

## Later capabilities

- OpenAPI-generated SDKs and larger parity suites
- GraphQL, tRPC, event sourcing, Redis, queues
- WebSockets, MCP, AI agents, semantic search
- Deployment previews, benchmarks, observability dashboards
- Alternate deployment providers and runtime compatibility certification

## Promotion policy

Promote from HOLD only after the active milestone has closed, a concrete product/parity need is documented, and a minimal acceptance-criteria-driven task exists. The owner's REJECTED decisions (e.g., Next.js/Vercel) do not return to candidates.
