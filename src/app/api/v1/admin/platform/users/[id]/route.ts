import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        rank: { select: { id: true, label: true } },
        _count: {
          select: {
            posts: true, comments: true, quizAttempts: true,
            questionReports: true, videoComments: true,
            sessionParticipations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error: any) {
    console.error("[PLATFORM_USER_GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = ["name", "email", "role", "isBanned", "banReason", "points", "studentId", "nickname"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAdminAction({
      adminId: session.user.id,
      action: "UPDATE",
      entityType: "USER",
      entityId: params.id,
      newState: updateData,
      description: `Updated user ${user.name} (${params.id})`,
    });

    return NextResponse.json({ data: user });
  } catch (error: any) {
    console.error("[PLATFORM_USER_PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
