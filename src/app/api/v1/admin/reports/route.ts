import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(session: any) {
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, canManageReports: true },
  });
  if (!user) return null;
  if (user.role !== "SUPER_ADMIN" && !user.canManageReports) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const admin = await requireAdmin(session);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status: status as any },
      include: {
        reporter: { select: { id: true, name: true, image: true } },
        actions: {
          include: { admin: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.report.count({ where: { status: status as any } }),
  ]);

  const counts = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "DISMISSED" } }),
    prisma.report.count({ where: { status: "RESOLVED" } }),
  ]);

  return NextResponse.json({ reports, total, counts: { pending: counts[0], dismissed: counts[1], resolved: counts[2] } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const admin = await requireAdmin(session);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { reportId, action, note } = body;

  if (!reportId || !action) {
    return NextResponse.json({ error: "reportId and action required" }, { status: 400 });
  }

  if (!["DISMISSED", "RESOLVED", "WARNED", "REMOVED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const [reportAction] = await Promise.all([
    prisma.reportAction.create({
      data: {
        reportId,
        action,
        note: note || null,
        adminId: session!.user.id,
      },
    }),
    prisma.report.update({
      where: { id: reportId },
      data: { status: action === "DISMISSED" ? "DISMISSED" : "RESOLVED" },
    }),
  ]);

  return NextResponse.json({ success: true, action: reportAction });
}
