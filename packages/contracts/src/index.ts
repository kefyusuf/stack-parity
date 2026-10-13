/**
 * A deliberately tiny shared contract for SPIKE-001.
 * Domain contracts (Product, Customer, Order) are out of scope.
 */
export const CONTRACT_VERSION = "spike-001" as const;

export type HealthResponse = {
  status: "ok";
  contractVersion: typeof CONTRACT_VERSION;
};
