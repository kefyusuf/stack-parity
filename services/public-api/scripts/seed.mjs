#!/usr/bin/env node
// Deterministic, idempotent seed for the Product and Customer tables
// (B1 + B2; D-B1-03 approved mechanism, extended by D-B2-02).
//
// Usage: DATABASE_URL=<connection string> node scripts/seed.mjs
// (or: pnpm --filter @stack-parity/public-api seed)
//
// The connection string lives outside Git (local secret store / env); this
// script never prints it and redacts it from any error output. Safe to
// re-run: existing rows are updated to the deterministic fixture values.
import { Client } from "pg";

const PRODUCTS = [{ id: "p-001", name: "Sample Product" }];

const CUSTOMERS = [
  { id: "c-001", email: "customer-001@stack-parity.test", name: "Sample Customer" },
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
  for (const row of PRODUCTS) {
    await client.query(
      'INSERT INTO "public"."Product" (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
      [row.id, row.name],
    );
  }
  for (const row of CUSTOMERS) {
    await client.query(
      'INSERT INTO "public"."Customer" (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name',
      [row.id, row.email, row.name],
    );
  }
  const products = await client.query('SELECT id, name FROM "public"."Product" ORDER BY id');
  console.log(`seed: ${PRODUCTS.length} product fixture row(s) ensured; table now holds ${products.rowCount} row(s)`);
  for (const row of products.rows) {
    console.log(`seed: ${row.id} ${row.name}`);
  }
  const customers = await client.query('SELECT id, name FROM "public"."Customer" ORDER BY id');
  console.log(`seed: ${CUSTOMERS.length} customer fixture row(s) ensured; table now holds ${customers.rowCount} row(s)`);
  for (const row of customers.rows) {
    console.log(`seed: ${row.id} ${row.name}`);
  }
} catch (error) {
  console.error(`seed failed: ${redact(error?.message ?? error)}`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
