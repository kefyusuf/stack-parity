import { module } from "@prisma/composer";
import { postgres } from "@prisma/composer-prisma-cloud/orm";
import { appContract } from "./services/public-api/src/contract.ts";
import publicApi from "./services/public-api/src/service.ts";

// B1/B2: publicApi depends on a Postgres resource whose data contract now
// carries the Product and Customer tables. Deploying this graph to any
// stage (including spike-001) creates that database on the stage and
// therefore requires the separate cloud approval recorded per milestone
// (B1-AC-06 pattern); do not run `pnpm compute:deploy` without one.
export default module("stack-parity", ({ provision }) => {
  const db = provision(
    postgres({
      name: "database",
      contract: appContract,
      config: "./services/public-api/prisma.config.ts",
    }),
    { id: "database" },
  );
  provision(publicApi, { id: "publicApi", deps: { db } });
});
