import { Hono } from "hono";
import {
  CONTRACT_VERSION,
  type CustomersResponse,
  type HealthResponse,
  type ProductReadResponse,
} from "@stack-parity/contracts";
import type { CustomerReader, ProductByIdReader, ProductReader } from "./product-reader.ts";
import {
  unconfiguredItemReader,
  unconfiguredListReader,
} from "./product-reader.ts";

/**
 * Explicit read dependencies (B1 gate D-B1-02; B2 gate D-B2-01). The
 * Composer-managed entry binds the database-backed readers; the standalone
 * runner fails closed without them. Reader errors are never echoed to the
 * client.
 */
export type ReadDependencies = {
  readProducts: ProductReader;
  readProductById: ProductByIdReader;
  readCustomers: CustomerReader;
};

/**
 * The B0 health surface, the B1 Product list slice and the B2 read
 * deepening (product detail + customer list). Semantics per the frozen
 * contracts: a missing product is 404, a failed read is 503 — the two are
 * never conflated; a null from the detail reader is the only not-found
 * signal.
 */
export function createApp(deps: ReadDependencies) {
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
      const items = await deps.readProducts();
      const response: ProductReadResponse = {
        products: [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      };
      return c.json(response);
    } catch {
      return c.json({ error: "product read unavailable" }, 503);
    }
  });

  app.get("/products/:id", async (c) => {
    try {
      const product = await deps.readProductById(c.req.param("id"));
      if (product === null) {
        return c.json({ error: "product not found" }, 404);
      }
      return c.json(product);
    } catch {
      return c.json({ error: "product read unavailable" }, 503);
    }
  });

  app.get("/customers", async (c) => {
    try {
      const items = await deps.readCustomers();
      const response: CustomersResponse = {
        customers: [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      };
      return c.json(response);
    } catch {
      return c.json({ error: "customer read unavailable" }, 503);
    }
  });

  return app;
}

const app = createApp({
  readProducts: unconfiguredListReader("product database not configured"),
  readProductById: unconfiguredItemReader("product database not configured"),
  readCustomers: unconfiguredListReader("customer database not configured"),
});

export default app;
