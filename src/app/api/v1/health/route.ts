import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

const log = createLogger("health");

export async function GET() {
  const checks: Record<string, { status: HealthStatus; latencyMs?: number; error?: string }> = {};

  // Prisma / DB check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy", latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: "unhealthy",
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: "healthy", latencyMs: Date.now() - redisStart };
  } catch (err) {
    checks.redis = {
      status: "unhealthy",
      latencyMs: Date.now() - redisStart,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Supabase Auth check (resolve URL without making an external HTTP call)
  const authStart = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
      checks.supabaseAuth = { status: "degraded", latencyMs: Date.now() - authStart, error: "SUPABASE_URL not configured" };
    } else {
      // Lightweight DNS/connectivity check — attempt a HEAD to supabase URL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(supabaseUrl, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeoutId);
      checks.supabaseAuth = {
        status: resp.ok ? "healthy" : "degraded",
        latencyMs: Date.now() - authStart,
        ...(hasAnonKey ? {} : { error: "NEXT_PUBLIC_SUPABASE_ANON_KEY not configured" }),
        ...(hasServiceKey ? {} : { warning: "SUPABASE_SERVICE_ROLE_KEY not configured" }),
      };
    }
  } catch (err) {
    checks.supabaseAuth = {
      status: "degraded",
      latencyMs: Date.now() - authStart,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const statuses = Object.values(checks).map((c) => c.status);
  const allHealthy = statuses.every((s) => s === "healthy");
  const anyUnhealthy = statuses.some((s) => s === "unhealthy");
  const overall: HealthStatus = allHealthy ? "healthy" : anyUnhealthy ? "unhealthy" : "degraded";
  const statusCode = overall === "unhealthy" ? 503 : 200;

  const response = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  if (overall !== "healthy") {
    log.warn("Health check degraded", { overall, unhealthyChecks: Object.entries(checks).filter(([,c]) => c.status !== "healthy").map(([k]) => k) });
  }

  return NextResponse.json(response, { status: statusCode });
}
