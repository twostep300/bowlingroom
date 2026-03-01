import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
let prismaInstance = globalForPrisma.prisma;
let prismaInitError = null;
if (!prismaInstance) {
  try {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
  } catch (error) {
    prismaInitError = error;
  }
}
const db = prismaInstance ?? new Proxy({}, {
  get() {
    throw prismaInitError instanceof Error ? prismaInitError : new Error("Prisma client failed to initialize");
  }
});

export { db as d };
