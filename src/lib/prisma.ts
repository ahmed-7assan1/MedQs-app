// lib/prisma.ts — singleton Prisma client with connection pooling
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL || "");
  // Override connection_limit & pool_timeout for serverless safety
  url.searchParams.set("connection_limit", "3");
  url.searchParams.set("pool_timeout", "5");

  return new PrismaClient({
    datasources: { db: { url: url.toString() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Graceful shutdown
process.on("beforeExit", () => prisma.$disconnect());

// Retry helper for transient connection drops
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionDrop =
        err?.message?.includes("closed the connection") ||
        err?.message?.includes("Connection reset") ||
        err?.message?.includes("timeout");
      if (i < retries && isConnectionDrop) {
        await new Promise((r) => setTimeout(r, 200 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
