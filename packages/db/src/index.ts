import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __sepaitoPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__sepaitoPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__sepaitoPrisma = prisma;
}
