import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const days = Math.max(1, parseInt(searchParams.get("days") || "7") || 7);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);

    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: { gte: since } };
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const events = await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    const hasMore = events.length > limit;
    const data = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    const total = await prisma.securityEvent.count({ where });

    const typeBreakdown = await prisma.securityEvent.groupBy({
      by: ["type", "severity", "status"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });

    const summary = {
      total,
      open: await prisma.securityEvent.count({ where: { ...where, status: { in: ["NEW", "INVESTIGATING"] } } }),
      critical: await prisma.securityEvent.count({ where: { ...where, severity: "CRITICAL" } }),
      high: await prisma.securityEvent.count({ where: { ...where, severity: "HIGH" } }),
    };

    return NextResponse.json({
      data,
      meta: { total, hasMore, nextCursor, summary },
      typeBreakdown,
    });
  } catch (error: any) {
    console.error("[PLATFORM_SECURITY] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
