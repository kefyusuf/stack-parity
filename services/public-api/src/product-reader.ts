import type { CustomerReadItem, ProductReadItem } from "@stack-parity/contracts";

/**
 * Minimal explicit read dependency seam (B1 gate D-B1-02; extended by B2
 * gate D-B2-01 with the product-detail and customer readers). The
 * Composer-managed entry binds the database-backed readers; the standalone
 * runner runs without a database and fails closed. These are plain function
 * types, not a repository or DI framework.
 */
export type ProductReader = () => Promise<readonly ProductReadItem[]>;

/**
 * Reads one product by its opaque id, or null when no product matches.
 * A thrown error means the read itself failed (unavailable), which the
 * route maps to 503 — null is the only not-found signal.
 */
export type ProductByIdReader = (id: string) => Promise<ProductReadItem | null>;

export type CustomerReader = () => Promise<readonly CustomerReadItem[]>;

/**
 * Readers for environments with no provisioned database: every read fails,
 * so the routes answer 503 instead of fabricating data or misreporting a
 * missing database as not-found.
 */
export function unconfiguredListReader<T>(reason: string): () => Promise<readonly T[]> {
  return () => Promise.reject(new Error(reason));
}

export function unconfiguredItemReader<T>(reason: string): (id: string) => Promise<T | null> {
  return async () => {
    throw new Error(reason);
  };
}
