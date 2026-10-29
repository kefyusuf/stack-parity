# B1-AC-06 Stage Evidence — Isolated Non-Production Deploy (2026-10-29)

**Result: `CLOUD_STAGE_PASSED`.** The approved isolated non-production Compute stage deployed, seeded privately, served database-backed `GET /products` to the public internet, and was fully torn down with the seed credential revoked. **All B1 acceptance criteria are now PASS** — see [the B1 gate](B1-product-read-api-gate.md). Approved plan: [the AC-06 runbook](B1-ac06-execution-runbook-20261028.md).

## Provenance and credential hygiene

- Approval: user, 2026-10-28 ("onaylı devam"), parameters per the runbook: stage `b1-product-read`, immediate teardown, owner = repository owner.
- Authentication: `PRISMA_SERVICE_TOKEN` read from the user's local file `C:\Users\yukonit\.prisma-service-token` (**outside the repository**) into the process environment only. The token value never appears in any output, log or committed file; the file is outside Git. The user should revoke/rotate this token now that the step is complete.
- Deployed tree: `main` @ `363242c` (`feat(b1): first Product read slice`). Region `eu-central-1`; project `stack-parity` (`proj_q0grrd4tmva01a7jw64q2sc4`).
- The database is **hosted Prisma Cloud Postgres** — nothing database-related runs in Docker; containers only ran the CLI and the seed script.

## Execution record

| Step | Command (shape) | Result |
| --- | --- | --- |
| Deploy | `pnpm exec prisma deploy module.ts --stage b1-product-read --yes --report` | **exit 0**, plan+apply `1m 18s`; resources: postgres-database `db_jvcs6592jr8gwui4yasqa4fc`, compute-service `cps_ri2oc2ayamcg8p50qrvdmlkk` |
| Public URL | from deploy result | `https://ri2oc2ayamcg8p50qrvdmlkk.fra.prisma.build` |
| Seed credential | `prisma postgres connection create <db-id> --name b1-seed` | one-time URL captured to container `/tmp` (length 150, **never displayed**); files removed after use |
| Private seed | `DATABASE_URL=<one-time URL> pnpm --filter @stack-parity/public-api seed` | `seed: 1 fixture row(s) ensured; table now holds 1 row(s)` / `p-001 Sample Product` |

Note: the first `connection create` attempt failed (`PROJECT.SETUP_REQUIRED` — the checkout was never linked to a Project); resolved by passing `--project proj_q0grrd4tmva01a7jw64q2sc4` explicitly instead of linking durable state. `prisma postgres list` confirmed the stage database `status: ready` before seeding.

## External verification (host `curl`, outside the platform)

```
GET https://ri2oc2ayamcg8p50qrvdmlkk.fra.prisma.build/products
→ 200 {"products":[{"id":"p-001","name":"Sample Product"}]}

GET https://ri2oc2ayamcg8p50qrvdmlkk.fra.prisma.build/health
→ 200 {"status":"ok","contractVersion":"spike-001"}
```

Database-backed JSON served from the seeded cloud Postgres through the deployed Hono service; the B0 `/health` surface unchanged. (A pg SSL-mode alias warning appeared during the seed client connection — informational, from `pg-connection-string`; no action.)

## Revocation and teardown (immediately after evidence)

| Step | Command (shape) | Result |
| --- | --- | --- |
| Revoke seed credential | `prisma postgres connection delete con_drg542g7pdn9305zcow4tv6n --confirm con_drg542g7pdn9305zcow4tv6n` | `ok:true`; connection list count `3 → 2` (the remaining two are platform-owned: the Postgres API key and the app's own binding credential) |
| Delete service | `prisma service delete cps_… --branch b1-product-read --confirm publicApi` | `deleted:true` (consent token is the service **name**) |
| Delete database | `prisma postgres delete db_jvcs6592jr8gwui4yasqa4fc --confirm db_jvcs6592jr8gwui4yasqa4fc` | `ok:true` (exact id confirmation) |

Post-teardown verification: `postgres list` count **0**; `service list --branch b1-product-read` **empty**; the external URL now returns **404**; `branch list` still shows `main` (production), `b1-product-read` (empty preview) and `spike-001` — **the live `spike-001` stage was never touched** (it has no database by design; its retirement remains a separate user decision).

## Warnings and limitations

1. **No numeric budget cap was set**; exposure was bounded by the immediate teardown (deploy 17:03 UTC → teardown 17:10 UTC, ~7 minutes of stage lifetime).
2. The service token remains valid until the user revokes/rotates it in the console — recommended now.
3. The `b1-product-read` branch object remains in the project (empty, no resources); removing it is optional console housekeeping.
4. `pnpm compute:deploy` (pins `--stage spike-001`) was not used; all commands named the stage explicitly.
