// Standalone local runner for Docker and native learning workflows.
// This file is NOT the Prisma Compute/Composer server entrypoint.
import app from "./app.ts";

Bun.serve({
  hostname: "0.0.0.0",
  port: 3000,
  fetch: app.fetch,
});
