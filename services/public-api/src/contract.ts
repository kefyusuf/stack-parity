// Hydrates the emitted application data contract (Product + Customer since
// B2). The single value serves both ends: the resource side via
// postgres({ contract, config }) in module.ts and the dependency side via
// postgres(appContract) in the service. The type is passed explicitly
// because a JSON import's inferred type would be plain data rather than the
// branded type (PSL-first authoring mode).
import { dataContract } from "@prisma/composer-prisma-cloud/orm";
import type { Contract } from "../contract.d.ts";
import contractJson from "../contract.json" with { type: "json" };

export const appContract = dataContract<Contract>(contractJson);
