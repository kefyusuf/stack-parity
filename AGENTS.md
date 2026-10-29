# StackParity — Agent Operating Rules

## Thesis

**One product. Many stacks. One contract.**

Build a production-shaped, open-source reference application demonstrating how independent TypeScript frameworks coexist in one product.

## Current gate: B1 COMPLETE — B2-D closed, B2-I awaiting authorization (2026-10-29)

B1 is fully closed (definition gate Issue #4/PR #5 on 2026-10-27; `GET /products` merged `363242c`, Issue #6/PR #7; AC-06 passed on an isolated, torn-down stage — [stage evidence](docs/milestones/B1-ac06-stage-evidence-20261029.md)). The live `spike-001` stage remains untouched (retirement is a separate user decision).

**B2 — read-path deepening (`GET /products/:id` + Customer read model): design gate CLOSED** (Issue #8, [B2-read-deepening-gate.md](docs/milestones/B2-read-deepening-gate.md)) — decisions D-B2-01..03 made by owner delegation per industry standards: bare single-resource object reusing `ProductReadItem`; `404 {"error":"product not found"}` for unknown ids (distinct from 503); `Customer {id, email, name}` with RFC 2606 `.test` fixture; cloud re-verification via the AC-06 runbook pattern with a new stage `b2-read-deepening` (fresh service token needed at that step). **B2-I implementation requires the owner's explicit go-ahead**, then proceeds in B1-style units. Owner red line: **Next.js and any Vercel-developed stack are rejected** ([HOLD.md](docs/roadmap/HOLD.md)); sequence: data deepening → Astro → NestJS.

Read `docs/milestones/B2-read-deepening-gate.md`, `docs/milestones/B1-product-read-api-gate.md`, and `docs/milestones/B1-i-implementation-evidence-20261028.md` before making changes.

## Non-negotiable boundaries

1. **Share contracts, not implementations.** Framework-specific handlers, services, hooks, composables and repositories stay in their respective apps.
2. **A framework requires a product role.** Do not scaffold a technology simply to expand a showcase.
3. **Roadmap is not active scope.** Do not implement HOLD work.
4. **Logical boundaries are not automatic microservices.** Avoid unnecessary deployables.
5. **One platform for V0.1:** Prisma Compute. **One planned database platform:** Prisma Postgres; no database in B0.
6. **No speculative abstraction.** Do not introduce adapters for hypothetical second providers or frameworks.
7. **Evidence before expansion.** Tests, build output, runtime checks and reachable service results must support completion claims.
8. **No secret material in Git.** Record redacted commands and service URLs only.
9. **Sponsorship is not a technical requirement.** Do not distort architecture to promote a vendor.
10. **Document uncertainty.** Mark unknown or blocked states honestly; never label an unverified remote deploy PASS.

## Execution workflow

Use small scoped issues/PRs. Choose NOW / NEXT / HOLD / REJECTED for new proposals. Start with a narrowly scoped technical spike when assumptions are uncertain. For implementation, use small verifiable units, tests when the behavior warrants them, and a review against the active brief before merging.

The project is agent/provider agnostic. Matt Pocock's workflow concepts may help organize work, but no proprietary agent configuration or global skill dependency is required.

## Completion report

Every technical PR must report:
- scope and changed paths;
- exact checks executed and their results;
- evidence against acceptance criteria;
- unresolved issues and known limitations;
- any deviations from the active milestone.
