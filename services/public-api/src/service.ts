import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";
import { postgres } from "@prisma/composer-prisma-cloud/orm";
import { productContract } from "./contract.ts";

export default compute({
  name: "publicApi",
  deps: {
    db: postgres(productContract),
  },
  build: node({
    module: import.meta.url,
    entry: "../dist/server.mjs",
  }),
});
