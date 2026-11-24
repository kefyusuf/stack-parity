import { describe, expect, test } from "bun:test";
import type { ProductReadItem } from "@stack-parity/contracts";
import { createApp } from "../src/app.ts";
import {
  unconfiguredItemReader,
  unconfiguredListReader,
} from "../src/product-reader.ts";

/**
 * Seam-level tests only: in-memory readers prove the routes, contract
 * shapes, ordering and failure behavior. Persistence proof is claimed
 * separately, against a real disposable Postgres.
 */
const secretError = "connection refused: postgres://user:secret@db.internal:5432/app";

describe("GET /products", () => {
  test("returns the shared contract shape with deterministic id ordering", async () => {
    const rows: ProductReadItem[] = [
      { id: "p-002", name: "Second" },
      { id: "p-001", name: "First" },
    ];
    const res = await createApp({
      readProducts: async () => rows,
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      products: [
        { id: "p-001", name: "First" },
        { id: "p-002", name: "Second" },
      ],
    });
  });

  test("returns an empty products array for an empty dataset", async () => {
    const res = await createApp({
      readProducts: async () => [],
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ products: [] });
  });

  test("returns 503 without echoing reader errors when the read fails", async () => {
    const res = await createApp({
      readProducts: async () => {
        throw new Error(secretError);
      },
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products");
    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("connection refused");
  });
});

describe("GET /products/:id (B2)", () => {
  test("returns the bare product resource for a known id", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: async (id) =>
        id === "p-001" ? { id: "p-001", name: "Sample Product" } : null,
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products/p-001");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "p-001", name: "Sample Product" });
  });

  test("returns 404 when no product matches the id", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: async () => null,
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products/does-not-exist");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "product not found" });
  });

  test("returns 503 — not 404 — when the detail read itself fails", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: async () => {
        throw new Error(secretError);
      },
      readCustomers: unconfiguredListReader("unused"),
    }).request("/products/p-001");
    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("connection refused");
  });
});

describe("GET /customers (B2)", () => {
  test("returns the shared contract shape with deterministic id ordering", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: async () => [
        { id: "c-002", email: "second@stack-parity.test", name: "Second" },
        { id: "c-001", email: "customer-001@stack-parity.test", name: "Sample Customer" },
      ],
    }).request("/customers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      customers: [
        { id: "c-001", email: "customer-001@stack-parity.test", name: "Sample Customer" },
        { id: "c-002", email: "second@stack-parity.test", name: "Second" },
      ],
    });
  });

  test("returns an empty customers array for an empty dataset", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: async () => [],
    }).request("/customers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ customers: [] });
  });

  test("returns 503 without echoing reader errors when the read fails", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: async () => {
        throw new Error(secretError);
      },
    }).request("/customers");
    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("connection refused");
  });
});

describe("GET /health (B0 surface unchanged)", () => {
  test("keeps the verified health response", async () => {
    const res = await createApp({
      readProducts: unconfiguredListReader("unused"),
      readProductById: unconfiguredItemReader("unused"),
      readCustomers: unconfiguredListReader("unused"),
    }).request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", contractVersion: "spike-001" });
  });
});
