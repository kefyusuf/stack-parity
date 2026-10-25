import { defineConfig as composer } from '@prisma/composer/config';
import { nodeBuild } from '@prisma/composer/node/control';
import { prismaCloud, prismaState } from '@prisma/composer-prisma-cloud/control';
import { defineConfig as orm } from '@prisma/orm-postgres/config';
import { definePrismaConfig } from 'prisma/config';

// Baseline StackParity configuration extended with the ORM section required
// by the Phase B probe (see docs/milestones/B1-phase-b-scratch-preparation-20261025.md).
// The ORM config anchors the probe contract source and the migrations
// directory; the deploy lowering loads it by path — the app build never
// imports it. The connection is a placeholder: the framework injects the
// real URL at hydrate (no-globals), so nothing reads it. Execution happens
// only inside the disposable probe volume against the exported baseline,
// never against this repository checkout.
export default definePrismaConfig({
  composer: composer({
    extensions: [prismaCloud({ region: 'eu-central-1' }), nodeBuild()],
    state: prismaState(),
  }),
  orm: orm({
    contract: './probe/contract.prisma',
    db: { connection: 'postgres://localhost:5432/placeholder' },
  }),
});
