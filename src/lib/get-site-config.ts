import { prisma } from "./prisma";

const g = globalThis as unknown as {
  __siteConfig?: { data: any; syncedAt: number };
};

const TTL = 5 * 60 * 1000;

export async function getSiteConfig() {
  const cached = g.__siteConfig;
  if (cached && Date.now() - cached.syncedAt < TTL) {
    return cached.data;
  }
  try {
    const config = await prisma.siteConfig.findFirst();
    g.__siteConfig = { data: config, syncedAt: Date.now() };
    return config;
  } catch {
    if (cached?.data) return cached.data;
    return null;
  }
}

export function invalidateSiteConfigCache() {
  if (g.__siteConfig) {
    g.__siteConfig.syncedAt = 0;
  }
}
