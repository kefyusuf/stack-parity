import { module } from "@prisma/composer";
import publicApi from "./services/public-api/src/service.ts";

export default module("stack-parity", ({ provision }) => {
  provision(publicApi);
});
