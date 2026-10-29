#!/usr/bin/env node
// Deterministic, idempotent Product seed (B1; D-B1-03 approved mechanism).
//
// Usage: DATABASE_URL=<connection string> node scripts/seed.mjs
// (or: pnpm --filter @stack-parity/public-api seed)
//
// The connection string lives outside Git (local secret store / env); this
// script never prints it and redacts it from any error output. Safe to
// re-run: existing rows are updated to the deterministic fixture values.
import { Client } from "pg";

const FIXTURE_ROWS = [
  { id: "p-001", name: "Sample Product" },
];

function redact(message) {
  return String(message).replace(/postgres:\/\/[^\s"']+/g, "postgres://<redacted>");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("seed: DATABASE_URL is required (connection string stays outside Git)");
  process.exit(1);
}

const client = new Client({ connectionString });
try {
  await client.connect();
  for (const row of FIXTURE_ROWS) {
    await client.query(
      'INSERT INTO "public"."Product" (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
      [row.id, row.name],
    );
  }
  const result = await client.query('SELECT id, name FROM "public"."Product" ORDER BY id');
  console.log(`seed: ${FIXTURE_ROWS.length} fixture row(s) ensured; table now holds ${result.rowCount} row(s)`);
  for (const row of result.rows) {
    console.log(`seed: ${row.id} ${row.name}`);
  }
} catch (error) {
  console.error(`seed failed: ${redact(error?.message ?? error)}`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
