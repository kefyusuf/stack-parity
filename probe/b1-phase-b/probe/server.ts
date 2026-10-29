// Probe entry mirroring the B0 standalone seam: imports the service surface
// and starts a loopback-only Bun server. Read-only by construction — no row
// mutation exists anywhere in this app; the persistence and mutation proofs
// are performed out-of-band through a separate local database connection by
// the reviewed runtime procedure. A failed query is a 503, never fabricated
// data and never an empty success.
import service from './service.ts';

const { db, port } = await service.load();

const handler = async (): Promise<Response> => {
  try {
    const all = await db.client.orm.public.ProbeResult.all();
    const rows = all
      .map((row) => ({ id: row.id, name: row.name }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return Response.json({ ok: true, results: rows });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
};

Bun.serve({ port, hostname: '127.0.0.1', fetch: handler });
