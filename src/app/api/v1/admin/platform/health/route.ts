import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSuperAdmin } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export const GET = withSuperAdmin(async () => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    return NextResponse.json({
      data: {
        db: { status: "healthy", latencyMs: dbLatency },
        api: { status: "healthy", uptime: process.uptime() },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[PLATFORM_HEALTH] Error:", error);
    return NextResponse.json({
      data: {
        db: { status: "unhealthy", latencyMs: -1 },
        api: { status: "degraded" },
        timestamp: new Date().toISOString(),
      },
    }, { status: 503 });
  }
});
