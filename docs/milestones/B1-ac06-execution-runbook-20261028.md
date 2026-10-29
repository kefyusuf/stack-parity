# B1-AC-06 Execution Runbook — Isolated Non-Production Stage (2026-10-28)

**Status: APPROVED TO EXECUTE (user, 2026-10-28).** The reviewer approved the AC-06 cloud step after the B1-I merge. This runbook records the approved plan before any deploy command runs. Never target `spike-001`; `pnpm compute:deploy` is forbidden here because it pins `--stage spike-001`.

## Approved parameters (defaults under the blanket approval)

| Parameter | Value | Note |
| --- | --- | --- |
| Stage / scope | `b1-product-read` | new, isolated, non-production; never `spike-001` |
| Deployed tree | `main` @ `363242c` | includes the Product resource + attested migration; deploy applies migrations |
| Owner | repository owner (Yusuf KEF) | commands run in their authenticated environment |
| Seed path | committed `scripts/seed.mjs` with a **per-consumer connection URL** (`prisma postgres connection create --name b1-seed`), **revoked immediately after seeding** | URL prints exactly once; lives only in the session env; never in Git or chat |
| Teardown | **immediately after external evidence** | bounds any billing exposure to the deploy window; if the user wants retention instead, they say so before step 1 |
| Budget | no numeric cap given; exposure bounded by immediate teardown | if the platform requires a paid tier for an additional stage, the user decides before continuing |

## Step 1 — user: provide a service token (one-time, no terminal commands)

The toolchain has no stored platform credentials and the CLI's browser-login callback cannot reach a container's loopback from the host browser. The CLI's documented non-interactive path is `PRISMA_SERVICE_TOKEN` ("In CI or other non-interactive environments, skip login and set PRISMA_SERVICE_TOKEN instead" — `prisma auth --help`).

1. Create a service token for the workspace in the Prisma console (browser).
2. Save it to `C:\Users\yukonit\.prisma-service-token` (plain file, **outside the repository**; never pasted into chat or committed).
3. Say it is ready — everything below is then executed by the assistant, reading the token from that file into the process environment only. The token value is never printed, logged or committed; after AC-06 the user should revoke/rotate it.

Fallback (if the console path is unavailable): an interactive `docker compose run --rm dev sh` session running `pnpm exec prisma auth login` + the steps below manually (the B0-familiar flow).

## Step 2 — deploy + private seed (assistant-executed, token from the local file)

Every command reads `PRISMA_SERVICE_TOKEN` from the local file; the database is **hosted Prisma Cloud Postgres — nothing database-related runs in Docker**; Docker is only the CLI runner:

```sh
export PRISMA_SERVICE_TOKEN="$(cat /c/Users/yukonit/.prisma-service-token)"
pnpm exec prisma deploy module.ts --stage b1-product-read --report /tmp/deploy-report.json
pnpm exec prisma postgres list                          # capture the stage db id (not a secret)
pnpm exec prisma postgres connection create <db-id> --name b1-seed > /tmp/seed-url   # prints ONCE, captured to file, never displayed
DATABASE_URL="$(cat /tmp/seed-url)" pnpm --filter @stack-parity/public-api seed
rm /tmp/seed-url
```

Expected: deploy report (resources + public service URL), migration applied by the deploy lowering, `seed: 1 fixture row(s) ensured`.

## Step 2 — external verification

`GET https://<service-url>/products` (public URL from the deploy report — not a secret, recorded in evidence) must return `200 {"products":[{"id":"p-001","name":"Sample Product"}]}`, and `/health` must return the unchanged B0 body. Run from outside the platform (any machine).

## Step 3 — revoke the seed credential

```sh
pnpm exec prisma postgres connection revoke <connection-id>   # exact id from step 1 output
```

## Step 4 — teardown (immediately after evidence)

```sh
pnpm exec prisma service delete publicApi        # exact flags confirmed at execution
pnpm exec prisma postgres delete <db-id>          # requires exact id confirmation
```

Post-teardown: `prisma service list` / `prisma postgres list` show the stage resources gone; `spike-001` untouched. Exact subcommand flags are confirmed via `--help` inside the session before each destructive command; a wrong or missing id is a stop condition, never a guess.

## Evidence to record afterwards

Deploy report (redacted: connection URLs/ids), external `GET /products` + `/health` bodies, seed output, revocation + teardown confirmations, exact command list, warnings/limitations — into `docs/milestones/B1-ac06-…-evidence.md`; then the gate doc's AC-06 flips from PENDING to PASS (or BLOCKED with the failing command and exit code, never improvised).
