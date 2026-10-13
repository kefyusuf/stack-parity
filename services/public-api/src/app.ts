import { Hono } from "hono";
import {
  CONTRACT_VERSION,
  type HealthResponse,
} from "@stack-parity/contracts";

const app = new Hono();

app.get("/health", (c) => {
  const response: HealthResponse = {
    status: "ok",
    contractVersion: CONTRACT_VERSION,
  };
  return c.json(response);
});

export default app;
