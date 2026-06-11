// lib/prisma.ts — singleton Prisma client
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Graceful shutdown — release connections on hot reload / server stop
process.on("beforeExit", () => prisma.$disconnect());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
