/**
 * A deliberately tiny shared contract for SPIKE-001.
 */
export const CONTRACT_VERSION = "spike-001" as const;

export type HealthResponse = {
  status: "ok";
  contractVersion: typeof CONTRACT_VERSION;
};

/**
 * Product read contract for B1, frozen by the B1-D review (2026-10-27):
 * `GET /products` returns this shape and nothing more. Ids are opaque
 * strings; ordering is internal (by id) and not a public query surface.
 * This HTTP contract is distinct from the Prisma ORM data contract.
 * Changes need a new review.
 */
export type ProductReadItem = {
  id: string;
  name: string;
};

export type ProductReadResponse = {
  products: ProductReadItem[];
};
