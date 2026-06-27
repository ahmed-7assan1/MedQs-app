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
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const days = Math.max(1, parseInt(searchParams.get("days") || "30") || 30);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);

    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: { gte: since } };
    if (userId) where.adminId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const logs = await prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        admin: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const hasMore = logs.length > limit;
    const data = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    const total = await prisma.adminActionLog.count({ where });

    return NextResponse.json({
      data,
      meta: { total, hasMore, nextCursor, filteredDays: days },
    });
  } catch (error: any) {
    console.error("[PLATFORM_AUDIT_LOGS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
