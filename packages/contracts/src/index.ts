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

/**
 * Customer read contract for B2, frozen by the B2-D review (2026-10-29,
 * industry-standard minimal customer identity): `GET /customers` returns
 * this shape and nothing more. Ids are opaque strings; the fixture email
 * uses the RFC 2606-reserved `.test` TLD. Read-only; ordering is internal
 * (by id) and not a public query surface. No uniqueness constraint exists
 * in B2 (recorded limitation until an order/checkout slice needs one).
 * Changes need a new review.
 */
export type CustomerReadItem = {
  id: string;
  email: string;
  name: string;
};

export type CustomersResponse = {
  customers: CustomerReadItem[];
};
