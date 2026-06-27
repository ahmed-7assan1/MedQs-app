import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const userId = searchParams.get("userId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    const warnings = await prisma.warning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        issuedBy: { select: { id: true, name: true } },
        revokedBy: { select: { id: true, name: true } },
      },
    });

    const hasMore = warnings.length > limit;
    const data = hasMore ? warnings.slice(0, limit) : warnings;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    const total = await prisma.warning.count({ where });

    return NextResponse.json({ data, meta: { total, hasMore, nextCursor } });
  } catch (error: any) {
    console.error("[PLATFORM_WARNINGS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, severity, reason, description, expiresAt } = body;

    if (!userId || !reason) {
      return NextResponse.json({ error: "userId and reason required" }, { status: 400 });
    }

    const warning = await prisma.warning.create({
      data: {
        userId,
        issuedById: session.user.id,
        severity: severity ?? "MODERATE",
        reason,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { warningCount: { increment: 1 } },
    });

    await logAdminAction({
      adminId: session.user.id,
      action: "WARN",
      entityType: "WARNING",
      entityId: warning.id,
      description: `Warning issued to user ${userId}: ${reason}`,
    });

    return NextResponse.json({ data: warning }, { status: 201 });
  } catch (error: any) {
    console.error("[PLATFORM_WARNINGS_POST] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
