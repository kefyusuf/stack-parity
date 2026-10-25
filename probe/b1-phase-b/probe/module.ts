// use prisma-8
//
// B1-D Phase B runtime probe module. Disposable compatibility fixture: one
// Postgres resource typed by the probe contract and one read-only compute
// service. The identity is task-unique so shared local emulators never
// collide with the original app identity (see docs/milestones/B1-phase-b-isolation-plan.md).
// The database provision id is "database" (not "db"): the prisma-cloud target
// passes it through as the Prisma resource name, and the Connection API
// rejects names shorter than 3 characters.
import { module } from '@prisma/composer';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import { probeContract } from './probe/contract.ts';
import probeReadService from './probe/service.ts';

export default module('stack-parity-b1-runtime-20261025', ({ provision }) => {
  const db = provision(
    postgres({ name: 'database', contract: probeContract, config: './prisma.config.ts' }),
    { id: 'database' },
  );
  provision(probeReadService, { id: 'proberead', deps: { db } });
});
