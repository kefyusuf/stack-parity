# B1-D Exit Review — D-B1-02 and D-B1-03 Decision Package (2026-10-27)

**Status: PROPOSED — requires reviewer decision; no runtime changes and no cloud operations are authorized by this document.** This package consolidates what remains to close the [B1 definition gate](B1-product-read-api-gate.md): reviewer-approved acceptance scope and resolved D-B1-02/03 (D-B1-01 is already runtime-resolved by [`LOCAL_DB_PASS`](B1-phase-b-runtime-evidence-20261027.md)).

## What the reviewer is deciding

| Decision | Question | Evidence basis |
| --- | --- | --- |
| **D-B1-02** | Approve the candidate `{id, name}` read contract, fixture behavior and mutation-proof design as the binding scope for B1-I | The Phase B probe executed exactly this mechanism (contract emit → typed client → migration → ORM read → out-of-band mutation → changed read) |
| **D-B1-03 (local)** | Ratify the disposable local DB reset procedure | Probe evidence: task-owned volume, ledger-compared teardown, inventories 0/0/0, never `--fresh`, strand behavior recorded |
| **D-B1-03 (stage)** | Decide the non-production stage items now, or defer them to the separately-authorized cloud step | No stage evidence exists; B1-AC-06 already requires a separate explicit cloud approval |

## D-B1-02 — proposed binding scope for B1-I (ready to approve)

- **Endpoint:** `GET /products`, HTTP 200, JSON object with a `products` array, in the existing `services/public-api` deployable. `GET /health` unchanged.
- **Read item shape:** `{ id: string, name: string }` — opaque string ids; no UUID or business-identifier scheme prescribed.
- **Populated response:** `{ "products": [{ "id": "p-001", "name": "Sample Product" }] }` backed by a deterministic seeded Product row; the fixture is **test data in Postgres, never a hard-coded HTTP response**.
- **Empty dataset:** HTTP 200 with `{ "products": [] }`.
- **Ordering:** internal, deterministic `order by id`; no public sort/query interface.
- **Shared surface:** the HTTP response type is exported from `@stack-parity/contracts`; Hono imports it by package boundary. The shared HTTP contract stays distinct from the Prisma ORM data contract (`contract.prisma` + emitted JSON/types). No cross-framework handler, DB connection or repository code in contracts.
- **Persistence proof (acceptance):** an out-of-band test-DB update must change the subsequent HTTP result (AC-03) — the probe demonstrated this exact proof; the Product implementation re-proves it for the Product table.
- **Failure behavior:** missing/unavailable DB yields non-200 without leaking connection strings and without fabricated or empty-success data (AC-04). The probe's 503 path plus the recorded DB-loss observation set the baseline: the implementation must include unhandled-rejection guards (the probe deliberately omitted them and died — recorded lesson).
- **Exclusions (unchanged):** no write endpoints/CRUD, no Customer/Order, no search/filter/sort/pagination, no pricing, no new apps or services, no repository/DI abstractions.

**Approval means:** the fields, fixture semantics and proof mechanism above become the acceptance scope checked by B1-AC-01..07; later changes need a new review.

## D-B1-03 (local) — reset procedure to ratify

The probe-recorded procedure, recommended as the standing B1 local-DB reset method:

1. The local test database lives **only** inside a task-owned Compose volume with a unique project id; state roots are the redirected `HOME`/XDG/TMPDIR/`PRISMA_COMPOSER_EMULATORS_DIR` paths.
2. Reset = remove **that task's** recorded resources (`down --volumes` against the task project) after comparing actual label-filtered inventories against the creation ledger; unexpected members are a stop condition.
3. **Never** `--fresh`, never `prisma dev rm`, never global emulator-state deletion, never touching other projects' resources (probe evidence: killed-daemon restart logs `Done: 0 succeeded` and does not re-ensure the DB — stranded state is removed only via the task ledger).

## D-B1-03 (stage) — recommendation: defer to the cloud step, decide the mechanism in advance

**Recommendation: defer.** Nothing in B1-I's local implementation needs a stage, and B1-AC-06 already gates any cloud deploy behind a separate explicit approval plus a validated non-public seed path. Deferring keeps "evidence before expansion" and avoids deciding billing items before they are needed.

The mechanism is nevertheless specified now, so the later approval is a review of facts, not a blank check:

- **Private, repeatable seed path:** after an approved isolated non-production deploy, the seed runs **once, locally**, from a developer-run script parameterized by the stage connection string held outside Git (local secret store/env). No unauthenticated HTTP write route, no startup re-seeding, no overwrite of `spike-001`.
- **Execution-time verifications before any deploy:** the exact CLI support for obtaining a stage connection string at the pinned toolchain versions is verified from help/source first; the stage owns its own isolated database (Composer deploy docs); seed output is recorded redacted.
- **Budget & ownership (user inputs if deciding now):** smallest available non-production stage; explicit monthly cap (user-set number); owner: repository owner (Yusuf KEF); teardown immediately after B1-AC-06 evidence unless retention is explicitly approved.
- **`spike-001`:** remains live and untouched; its retirement is a separate, user-owned decision independent of B1.

## Exit checklist after decisions

1. D-B1-02 approved → gate doc marks it resolved with the approved scope.
2. D-B1-03 local ratified; stage items either deferred (noted) or resolved with user inputs.
3. Reviewer approves the B1-I acceptance criteria (AC-01..07) as scoped above.
4. B1-D closes with an explicit statement that implementation itself remains a **separate authorization** (next issue/PR).

No cloud operation, no stage creation, and no Product implementation are authorized by this document.
