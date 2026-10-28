import { module } from "@prisma/composer";
import { postgres } from "@prisma/composer-prisma-cloud/orm";
import { productContract } from "./services/public-api/src/contract.ts";
import publicApi from "./services/public-api/src/service.ts";

// B1: publicApi now depends on a Product-read Postgres resource.
// Deploying this graph to any stage (including spike-001) creates that
// database on the stage and therefore requires the separate B1-AC-06 cloud
// approval; do not run `pnpm compute:deploy` without it.
export default module("stack-parity", ({ provision }) => {
  const db = provision(
    postgres({
      name: "database",
      contract: productContract,
      config: "./services/public-api/prisma.config.ts",
    }),
    { id: "database" },
  );
  provision(publicApi, { id: "publicApi", deps: { db } });
});
