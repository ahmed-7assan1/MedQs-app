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
    const adminId = searchParams.get("adminId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const days = Math.max(1, parseInt(searchParams.get("days") || "7") || 7);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);

    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: { gte: since } };
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

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

    const adminSummary = await prisma.adminActionLog.groupBy({
      by: ["adminId"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const adminIds = adminSummary.map((a) => a.adminId);
    const adminUsers = adminIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
    const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

    const adminsWithNames = adminSummary.map((a) => {
      const admin = adminMap.get(a.adminId);
      return { adminId: a.adminId, name: admin?.name ?? null, email: admin?.email ?? null, image: admin?.image ?? null, actionCount: a._count.id };
    });

    const actionBreakdown = await prisma.adminActionLog.groupBy({
      by: ["action", "entityType"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return NextResponse.json({
      data,
      meta: { total, hasMore, nextCursor },
      summaries: { adminSummary: adminsWithNames, actionBreakdown },
    });
  } catch (error: any) {
    console.error("[PLATFORM_ADMIN_MONITORING] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
