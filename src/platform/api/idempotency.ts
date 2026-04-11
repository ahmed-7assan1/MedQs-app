import { cacheGet, cacheSet } from "@/lib/redis";

export async function withIdempotency<T>(args: {
  scopeKey: string;
  idempotencyKey: string | null | undefined;
  action: () => Promise<T>;
}): Promise<{ reused: boolean; value: T }> {
  const key = args.idempotencyKey?.trim();
  if (!key) {
    return { reused: false, value: await args.action() };
  }

  // V1 uses Redis cache. V2 should migrate to a durable IdempotencyRecord table.
  const cacheId = `idem:${args.scopeKey}:${key}`;
  const existing = await cacheGet(cacheId).catch(() => null);
  if (existing) {
    return { reused: true, value: JSON.parse(existing) as T };
  }

  const value = await args.action();
  await cacheSet(cacheId, JSON.stringify(value), 60 * 60).catch(() => null);

  return { reused: false, value };
}
