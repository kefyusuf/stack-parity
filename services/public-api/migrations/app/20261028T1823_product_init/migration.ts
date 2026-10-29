#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c5e8c20a65e7a2d6bc8dc1405e289b7377520cb22097b5dbc3480c1f337ee7dd/contract';
import endContract from '../../snapshots/c5e8c20a65e7a2d6bc8dc1405e289b7377520cb22097b5dbc3480c1f337ee7dd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Product',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
