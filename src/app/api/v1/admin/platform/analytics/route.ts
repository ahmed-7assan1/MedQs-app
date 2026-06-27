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
    const section = searchParams.get("section") || "devices";
    const days = Math.max(1, parseInt(searchParams.get("days") || "30") || 30);
    const since = new Date(Date.now() - days * 86400000);

    switch (section) {
      case "devices": {
        const deviceData = await prisma.userSessionLog.groupBy({
          by: ["deviceType", "platform"],
          where: { startedAt: { gte: since } },
          _count: { id: true },
          _sum: { durationSeconds: true },
        });
        return NextResponse.json({ data: deviceData });
      }
      case "features": {
        const engagementData = await prisma.engagementLog.groupBy({
          by: ["action"],
          where: { createdAt: { gte: since } },
          _count: { id: true },
          _sum: { points: true },
          orderBy: { _count: { id: "desc" } },
        });
        return NextResponse.json({ data: engagementData });
      }
      case "content-quality": {
        const totalQuestions = await prisma.question.count();
        const questionsWithReports = await prisma.question.count({
          where: { reports: { some: {} } },
        });
        const avgDifficulty = await prisma.question.groupBy({
          by: ["difficulty"],
          _count: { id: true },
        });
        return NextResponse.json({
          data: {
            totalQuestions,
            questionsWithReports,
            reportRate: totalQuestions > 0 ? ((questionsWithReports / totalQuestions) * 100).toFixed(1) : "0",
            difficultyBreakdown: avgDifficulty,
          },
        });
      }
      case "api-usage": {
        const apiUsage = await prisma.adminActionLog.groupBy({
          by: ["action", "entityType"],
          where: { createdAt: { gte: since } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 30,
        });
        return NextResponse.json({ data: apiUsage });
      }
      case "retention": {
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const monthAgo = new Date(Date.now() - 30 * 86400000);
        const [active7d, active30d, total] = await Promise.all([
          prisma.user.count({ where: { lastActivityAt: { gte: weekAgo } } }),
          prisma.user.count({ where: { lastActivityAt: { gte: monthAgo } } }),
          prisma.user.count(),
        ]);
        return NextResponse.json({
          data: {
            active7d,
            active30d,
            total,
            retention7d: total > 0 ? ((active7d / total) * 100).toFixed(1) : "0",
            retention30d: total > 0 ? ((active30d / total) * 100).toFixed(1) : "0",
          },
        });
      }
      case "search": {
        const searchQueries = await prisma.engagementLog.count({
          where: { action: { contains: "search", mode: "insensitive" }, createdAt: { gte: since } },
        });
        return NextResponse.json({ data: { totalSearchQueries: searchQueries, period: `${days}d` } });
      }
      default:
        return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[PLATFORM_ANALYTICS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
