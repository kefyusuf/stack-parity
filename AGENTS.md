# StackParity — Agent Operating Rules

## Thesis

**One product. Many stacks. One contract.**

Build a production-shaped, open-source reference application demonstrating how independent TypeScript frameworks coexist in one product.

## Current gate: B1 definition — planning only

B0 / SPIKE-001 is closed with evidence: PR #3 merged and Issue #1 closed on 2026-10-13. The active task is Issue #4, a documentation/review gate for the first Product read-only API slice. **Do not implement Product, provision a database, deploy another cloud stage, or promote HOLD technologies until B1 is reviewed and explicitly authorized.**

Read `docs/bootstrap-brief-v0.1.md`, `docs/spikes/SPIKE-001.md`, and `docs/milestones/B1-product-read-api-gate.md` before making changes.

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
