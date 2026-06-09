import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { targetType, targetId, reason, description } = body;

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "targetType, targetId, reason required" }, { status: 400 });
  }

  if (!["POST", "COMMENT", "USER"].includes(targetType)) {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId,
      reason,
      description: description || null,
      reporterId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, report });
}
