# StackParity — Agent Operating Rules

## Thesis

**One product. Many stacks. One contract.**

Build a production-shaped, open-source reference application demonstrating how independent TypeScript frameworks coexist in one product.

## Current gate: B1 COMPLETE — all acceptance criteria PASS (2026-10-29)

B0 / SPIKE-001 closed with evidence. **B1 is fully closed**: the definition gate (Issue #4, PR #5) closed 2026-10-27, the first Product read slice (`GET /products` on the existing Hono service over Prisma Postgres) was implemented and merged (`363242c`, Issue #6, PR #7), and AC-06 passed on an isolated stage that was deployed, privately seeded, externally verified and torn down ([stage evidence](docs/milestones/B1-ac06-stage-evidence-20261029.md)). The live `spike-001` stage remains untouched (retirement is a separate user decision). **Next milestone work requires a new scoped proposal per the roadmap.** Any new cloud stage deploy still requires its own approval. HOLD technologies (Astro/Next/Nuxt/Nest) remain out of scope.

Read `docs/milestones/B1-product-read-api-gate.md`, `docs/milestones/B1-i-implementation-evidence-20261028.md`, and `docs/milestones/B1-ac06-stage-evidence-20261029.md` before making changes.

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
