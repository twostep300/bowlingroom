import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance = globalForPrisma.prisma;
let prismaInitError: unknown = null;

if (!prismaInstance) {
  try {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
  } catch (error) {
    prismaInitError = error;
  }
}

export const db = (prismaInstance ?? new Proxy({}, {
  get() {
    throw prismaInitError instanceof Error
      ? prismaInitError
      : new Error('Prisma client failed to initialize');
  }
})) as PrismaClient;
