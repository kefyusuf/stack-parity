import { describe, expect, test } from "bun:test";
import type { ProductReadItem } from "@stack-parity/contracts";
import { createApp } from "../src/app.ts";

/**
 * Seam-level tests only: an in-memory reader proves the route, contract
 * shape, ordering and failure behavior. Persistence proof (AC-03/AC-04)
 * is claimed separately, against a real disposable Postgres.
 */
describe("GET /products", () => {
  test("returns the shared contract shape with deterministic id ordering", async () => {
    const rows: ProductReadItem[] = [
      { id: "p-002", name: "Second" },
      { id: "p-001", name: "First" },
    ];
    const res = await createApp(async () => rows).request("/products");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      products: [
        { id: "p-001", name: "First" },
        { id: "p-002", name: "Second" },
      ],
    });
  });

  test("returns an empty products array for an empty dataset", async () => {
    const res = await createApp(async () => []).request("/products");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ products: [] });
  });

  test("returns 503 without echoing reader errors when the read fails", async () => {
    const res = await createApp(async () => {
      throw new Error("connection refused: postgres://user:secret@db.internal:5432/app");
    }).request("/products");
    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("connection refused");
  });
});

describe("GET /health (B0 surface unchanged)", () => {
  test("keeps the verified health response", async () => {
    const res = await createApp(async () => []).request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", contractVersion: "spike-001" });
  });
});
