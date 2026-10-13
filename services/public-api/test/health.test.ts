import { expect, test } from "bun:test";
import { CONTRACT_VERSION } from "@stack-parity/contracts";
import app from "../src/app.ts";

test("GET /health returns the version from the shared contracts package", async () => {
  const response = await app.request("/health");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    status: "ok",
    contractVersion: CONTRACT_VERSION,
  });
});
