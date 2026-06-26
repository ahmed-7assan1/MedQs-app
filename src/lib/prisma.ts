// lib/prisma.ts — singleton Prisma client with connection pooling
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    if (typeof window !== "undefined") {
      return new Proxy({} as PrismaClient, {
        get: () => () => Promise.reject(new Error("DATABASE_URL is not set on the server"))
      }) as PrismaClient;
    }
    throw new Error("DATABASE_URL is not set in environment variables. Check your .env file.");
  }
  const url = new URL(raw);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", process.env.DATABASE_CONNECTION_LIMIT || "15");
  }

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
