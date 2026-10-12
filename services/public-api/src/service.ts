import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "public-api",
  deps: {},
  build: node({
    module: import.meta.url,
    entry: "../dist/server.mjs",
  }),
});
