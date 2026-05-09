import { PrismaClient } from '@sepaito/db';

/**
 * Server-only Prisma client. Reused across requests via the `globalThis`
 * trick so that hot-reload in dev does not exhaust the connection pool.
 *
 * NEVER import this from a client component — it pulls in @prisma/client.
 */
declare global {
  // eslint-disable-next-line no-var
  var __sepaitoWebPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__sepaitoWebPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__sepaitoWebPrisma = prisma;
}
