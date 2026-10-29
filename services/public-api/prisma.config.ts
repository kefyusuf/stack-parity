import { defineConfig as orm } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

// ORM config for the Product read resource. It anchors the contract source
// and the migrations directory on the filesystem; the deploy lowering loads
// it by path (from the postgres resource in module.ts) — the app build never
// imports it. The connection is a placeholder: the compute binding injects
// the real URL at hydrate (no-globals), so nothing reads it. The Composer
// control-plane config stays in the root prisma.config.ts.
export default definePrismaConfig({
  orm: orm({
    contract: "./contract.prisma",
    db: { connection: "postgres://localhost:5432/placeholder" },
  }),
});
