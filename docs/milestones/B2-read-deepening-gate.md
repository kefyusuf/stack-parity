# B2 Definition Gate — Read-Path Deepening (Product detail + Customer)

- **Status: B2-D CLOSED (2026-10-29) — decisions made by owner delegation ("sektör standartlarında karar ver") and recorded below; B2-I awaits separate authorization.**
- **Basis:** B1 closed with all acceptance criteria PASS (2026-10-29); this is the first promotion from [HOLD](../roadmap/HOLD.md) per its policy and the owner's stated sequence (deepen data → Astro → NestJS; **Next.js/Vercel rejected**).
- **Change type:** planning and acceptance boundary only; no runtime changes in this PR.

## Product purpose

Deepen the read path of the **existing single deployable** (`services/public-api`) before any second stack is introduced. Two narrow read additions, reusing every B1 mechanism:

```text
Prisma Postgres → Hono GET /products/:id  → contract-typed JSON (404 for unknown id)
Prisma Postgres → Hono GET /customers     → contract-typed JSON (read-only list)
                                    |
                                    +-- imports @stack-parity/contracts (read shapes)
```

`GET /products` (list) and `GET /health` stay unchanged. No second service, no new deployable.

## Frozen observable contracts (decisions D-B2-01/02, 2026-10-29 — industry-standard REST)

- **`GET /products/:id`** → `200 {"id": "p-001", "name": "Sample Product"}` — the **bare resource object**, matching the dominant single-resource GET convention (GitHub, Stripe); the type is the existing shared `ProductReadItem`, so list item and detail share one contract shape. The collection keeps its named envelope (`{"products": [...]}`), the standard extensible-list pattern.
- **Unknown id → `404 {"error": "product not found"}`** — RFC 9110 correct status, deliberately distinct from the B1 `503` unavailable-DB response. Any non-matching opaque id is 404 (no id-format validation). Error bodies stay the minimal B1-style `{"error": "…"}` (an RFC 9457 problem-details upgrade remains a later capability, not B2 scope).
- **`GET /customers`** → `200 {"customers": [{"id": "c-001", "email": "customer-001@stack-parity.test", "name": "Sample Customer"}]}`; empty dataset → `{"customers": []}`; internal order by `id`; read-only to callers. Customer fields `{id, email, name}` mirror the industry-standard minimal customer identity (Stripe/Shopify customer objects); the fixture email uses the RFC 2606-reserved `.test` TLD. No uniqueness constraint is added in B2 (noted limitation until an order/checkout slice needs it).
- Shared types exported from `@stack-parity/contracts` (`ProductReadItem` reused; new `CustomerReadItem` / `CustomersResponse`); the ORM data contract gains the `Customer` model; B1's separation between HTTP contract and ORM data contract holds.
- Fixtures are deterministic seed data (extending the committed seed script), never hard-coded responses.

## Evidence-gated sequencing

### Gate B2-D — design decision (CLOSED 2026-10-29)

1. ~~Review/freeze the response shapes above, the 404-vs-503 semantics, and the Customer field set + fixture.~~ **Resolved (D-B2-01/02):** bare resource object for single GET reusing `ProductReadItem`; `404 {"error": "product not found"}` for unknown ids; `Customer {id, email, name}` with the RFC 2606 `.test` fixture email.
2. **Confirmed:** reuse of the B1 mechanics — contract emit, migration authoring + self-attestation (run from `services/public-api`), seed script extension, out-of-band mutation proof, runtime verification procedure, `bun build` before local assembly.
3. **D-B2-03 RESOLVED:** B2 closes with a **cloud re-verification using the AC-06 runbook pattern** — industry standard is a deploy-and-smoke-test of the changed surface in a prod-like environment, and the incremental cost is minutes (B1's stage lived ~7 minutes with immediate teardown). New stage name `b2-read-deepening`; same `PRISMA_SERVICE_TOKEN` path (the previous token was revoked — the user will mint a fresh one at that step); same revocation + teardown discipline; `spike-001` and every other stage remain untouched.

### Gate B2-I — implementation (NEXT; NOT YET AUTHORIZED)

Small verifiable units mirroring B1: contract types → seam + routes + tests → `Product` detail lookup + `Customer` table/migration/seed/typed reader with out-of-band proof → evidence consolidation. Any cloud step is a separate approval reusing the AC-06 runbook pattern.

## Strict exclusions

No Next.js or any Vercel-developed stack (owner red line, 2026-10-29), no Order model yet, no write endpoints or CRUD, no NestJS/Astro/Nuxt yet, no new services or deployables, no search/filter/pagination, no production deployment.

## Decisions — closed 2026-10-29 (owner delegation: "sektör standartlarında karar ver")

- **D-B2-01 RESOLVED:** single-resource GET returns the bare object (reusing `ProductReadItem`); unknown id → `404 {"error": "product not found"}` (RFC 9110; distinct from B1's 503); collection keeps the named envelope; error bodies stay minimal B1-style.
- **D-B2-02 RESOLVED:** `Customer = {id, email, name}` (industry-standard minimal customer identity); deterministic fixture `c-001 / customer-001@stack-parity.test / Sample Customer`; no uniqueness constraint in B2 (recorded limitation).
- **D-B2-03 RESOLVED:** cloud re-verification via the AC-06 runbook pattern with a new stage `b2-read-deepening`, immediate teardown; requires a fresh service token at that step (previous token revoked by the user).

**Exit from B2-D: recorded 2026-10-29.** B2-I (implementation) remains a **separately authorized** task: small verifiable units mirroring B1 — contract types → seam + routes + tests → Product detail lookup + Customer table/migration/seed/typed reader with out-of-band proof → evidence consolidation → stage verification per D-B2-03.
