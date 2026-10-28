import type { ProductReadItem } from "@stack-parity/contracts";

/**
 * Minimal explicit Product read dependency seam (B1 gate, D-B1-02).
 * The Composer-managed entry binds the database-backed reader; the
 * standalone runner runs without a database and fails closed. This is a
 * single function type, not a repository or DI framework.
 */
export type ProductReader = () => Promise<readonly ProductReadItem[]>;

/**
 * Reader for environments with no provisioned database: every read fails,
 * so `GET /products` answers 503 instead of fabricating or empty data.
 */
export function unconfiguredProductReader(reason: string): ProductReader {
  return () => Promise.reject(new Error(reason));
}
