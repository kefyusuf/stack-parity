import service from "./service.ts";
import app from "./app.ts";

Bun.serve({
  port: service.port(),
  hostname: "0.0.0.0",
  fetch: app.fetch,
});
