import type { CustomerReadItem, ProductReadItem } from "@stack-parity/contracts";
import { createApp } from "./app.ts";
import type { CustomerReader, ProductByIdReader, ProductReader } from "./product-reader.ts";
import service from "./service.ts";

// Composer-managed entrypoint: the compute binding injects the database
// URL and typed client at hydrate (no-globals) — nothing here reads a
// connection string. Guard the process so idle-connection drops from
// Prisma Postgres are logged instead of crashing into a restart loop
// (B1 runtime probe lesson).
process.on("unhandledRejection", (reason) => {
  console.error(
    "[public-api] unhandled rejection:",
    reason instanceof Error ? reason.message : reason,
  );
});
process.on("uncaughtException", (err) => {
  console.error("[public-api] uncaught exception:", err.message);
});

const { db } = await service.load();
const port = service.port();

const readProducts: ProductReader = async () => {
  const rows = await db.client.orm.public.Product.all();
  const items: ProductReadItem[] = rows.map((row) => ({ id: row.id, name: row.name }));
  return items;
};

// The rc.17 typed-client read surface exposes `.all()` for model reads
// (no filter/where accessors in the generated typings), so the detail
// lookup selects client-side after a real database read. Revisit when the
// filter API is documented.
const readProductById: ProductByIdReader = async (id) => {
  const rows = await db.client.orm.public.Product.all();
  const row = rows.find((candidate) => candidate.id === id);
  return row ? { id: row.id, name: row.name } : null;
};

const readCustomers: CustomerReader = async () => {
  const rows = await db.client.orm.public.Customer.all();
  const items: CustomerReadItem[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
  }));
  return items;
};

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: createApp({ readProducts, readProductById, readCustomers }).fetch,
});
