import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
}
