import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'] // Это будет выводить все SQL-запросы в консоль — очень удобно для отладки
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
