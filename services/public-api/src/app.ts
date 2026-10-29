import { Hono } from "hono";
import {
  CONTRACT_VERSION,
  type HealthResponse,
  type ProductReadResponse,
} from "@stack-parity/contracts";
import { unconfiguredProductReader } from "./product-reader.ts";
import type { ProductReader } from "./product-reader.ts";

/**
 * The B0 health surface plus the B1 Product read slice. The Product reader
 * is an explicit dependency so the Composer-managed entry can bind the
 * database-backed reader while the standalone runner fails closed without
 * one. Reader errors are never echoed to the client.
 */
export function createApp(readProducts: ProductReader) {
  const app = new Hono();

  app.get("/health", (c) => {
    const response: HealthResponse = {
      status: "ok",
      contractVersion: CONTRACT_VERSION,
    };
    return c.json(response);
  });

  app.get("/products", async (c) => {
    try {
      const items = await readProducts();
      const response: ProductReadResponse = {
        products: [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      };
      return c.json(response);
    } catch {
      return c.json({ error: "product read unavailable" }, 503);
    }
  });

  return app;
}

const app = createApp(unconfiguredProductReader("product database not configured"));

export default app;
