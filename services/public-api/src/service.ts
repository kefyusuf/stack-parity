import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "publicApi",
  deps: {},
  build: node({
    module: import.meta.url,
    entry: "../dist/server.mjs",
  }),
});
