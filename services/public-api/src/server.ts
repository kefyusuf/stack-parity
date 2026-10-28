import type { ProductReadItem } from "@stack-parity/contracts";
import { createApp } from "./app.ts";
import type { ProductReader } from "./product-reader.ts";
import service from "./service.ts";

// Composer-managed entrypoint: the compute binding injects the Product
// database URL and typed client at hydrate (no-globals) — nothing here
// reads a connection string. Guard the process so idle-connection drops
// from Prisma Postgres are logged instead of crashing into a restart loop
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

const { db, port } = await service.load();

const readProducts: ProductReader = async () => {
  const rows = await db.client.orm.public.Product.all();
  const items: ProductReadItem[] = rows.map((row) => ({ id: row.id, name: row.name }));
  return items;
};

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: createApp(readProducts).fetch,
});
