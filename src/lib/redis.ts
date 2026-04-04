import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Rate limiting helpers ────────────────────────────────────────────────────

export const ENGAGEMENT_HOURLY_LIMITS: Record<string, number> = {
  post: 5,
  comment: 10,
  like: 20,
  share: 5,
};

/** Increment with TTL; on Redis failure returns 1 so routes keep working (e.g. local dev without Redis). */
export async function redisIncrWithExpire(key: string, ttlSeconds: number): Promise<number> {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);
    return count;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[redis] incr unavailable — rate limit skipped:", err instanceof Error ? err.message : err);
    }
    return 1;
  }
}

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  return count <= (ENGAGEMENT_HOURLY_LIMITS[action] ?? 100);
}

// ─── Notification pub/sub ─────────────────────────────────────────────────────

export async function publishNotification(
  userId: string,
  payload: object
) {
  try {
    await redis.publish(`notifications:${userId}`, JSON.stringify(payload));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[redis] publish skipped:", err instanceof Error ? err.message : err);
    }
  }
}

export async function broadcastNotification(
  userIds: string[],
  payload: object
) {
  try {
    const pipeline = redis.pipeline();
    for (const id of userIds) {
      pipeline.publish(`notifications:${id}`, JSON.stringify(payload));
    }
    await pipeline.exec();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[redis] broadcast skipped:", err instanceof Error ? err.message : err);
    }
  }
}

// ─── Session cache ────────────────────────────────────────────────────────────

export async function cacheSet(key: string, value: string, ttlSeconds = 300) {
  await redis.setex(key, ttlSeconds, value);
}

export async function cacheGet(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function cacheDel(key: string) {
  await redis.del(key);
}
