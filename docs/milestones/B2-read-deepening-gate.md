# B2 Definition Gate — Read-Path Deepening (Product detail + Customer)

- **Status: PROPOSED / REVIEW REQUIRED — implementation not authorized**
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

## Proposed minimal observable contracts (not frozen until review)

- **`GET /products/:id`** → `200 {"product": {"id": "p-001", "name": "Sample Product"}}`; **unknown id → `404 {"error": "product not found"}`** — deliberately distinct from the B1 `503` unavailable-DB response; internal lookup by exact id, no public query surface.
- **`GET /customers`** → `200 {"customers": [{"id": "c-001", "name": "Sample Customer"}]}`; empty dataset → `{"customers": []}`; internal order by `id`; read-only to callers.
- Shared types exported from `@stack-parity/contracts`; the ORM data contract (`services/public-api/contract.prisma`) gains the `Customer` model; B1's separation between HTTP contract and ORM data contract holds.
- Fixtures are deterministic seed data (extending the committed seed script), never hard-coded responses.

## Evidence-gated sequencing

### Gate B2-D — design decision (NOW; docs only)

1. Review/freeze the response shapes above, the 404-vs-503 semantics, and the Customer field set + fixture.
2. Confirm reuse of the B1 mechanics: contract emit, migration authoring + self-attestation, seed script extension, out-of-band mutation proof, runtime verification procedure.
3. Decide **D-B2-03:** does B2 need a cloud re-verification (new isolated stage via the same runbook + service-token path) or does local evidence suffice for closure, with cloud deferred?

### Gate B2-I — implementation (NEXT; NOT YET AUTHORIZED)

Small verifiable units mirroring B1: contract types → seam + routes + tests → `Product` detail lookup + `Customer` table/migration/seed/typed reader with out-of-band proof → evidence consolidation. Any cloud step is a separate approval reusing the AC-06 runbook pattern.

## Strict exclusions

No Next.js or any Vercel-developed stack (owner red line, 2026-10-29), no Order model yet, no write endpoints or CRUD, no NestJS/Astro/Nuxt yet, no new services or deployables, no search/filter/pagination, no production deployment.

## Decisions still open

- **D-B2-01:** exact response shapes + not-found semantics (proposal above).
- **D-B2-02:** Customer field set + deterministic fixture.
- **D-B2-03:** cloud re-verification scope for closure.

**Exit from B2-D:** reviewer-approved shapes, resolved D-B2-01..03, and a separately authorized implementation task. Opening this document alone is not approval.
