# StackParity — Agent Operating Rules

## Thesis

**One product. Many stacks. One contract.**

Build a production-shaped, open-source reference application demonstrating how independent TypeScript frameworks coexist in one product.

## Current gate: B1-I — first Product read slice (authorized 2026-10-27)

B0 / SPIKE-001 is closed with evidence (PR #3 merged, Issue #1 closed). The B1 definition gate (Issue #4, PR #5) closed on 2026-10-27: D-B1-01 runtime-resolved (`LOCAL_DB_PASS`), D-B1-02 contract scope approved, D-B1-03 local reset ratified and stage items deferred to the separately-authorized cloud step (B1-AC-06). **B1-I is explicitly authorized: implement `GET /products` in the existing Hono service per the approved scope, in small verifiable units. Any cloud stage deploy still requires its own separate approval. HOLD technologies (Astro/Next/Nuxt/Nest) remain out of scope.**

Read `docs/milestones/B1-product-read-api-gate.md`, `docs/milestones/B1-d-exit-review-20261027.md`, and `docs/milestones/B1-phase-b-runtime-evidence-20261027.md` before making changes.

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
