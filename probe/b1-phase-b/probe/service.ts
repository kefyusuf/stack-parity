// One compute service with one dependency: the probe Postgres binding. The
// binding carries the connection URL and the lazily-built typed ORM client,
// injected at hydrate (no-globals); nothing here reads a connection string.
// The build target stays inside probe/ so probe output never mixes with the
// exported baseline tree.
import node from '@prisma/composer/node';
import { compute } from '@prisma/composer-prisma-cloud';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import { probeContract } from './contract.ts';

export default compute({
  name: 'proberead',
  deps: {
    db: postgres(probeContract),
  },
  build: node({ module: import.meta.url, entry: './dist/server.mjs' }),
});
