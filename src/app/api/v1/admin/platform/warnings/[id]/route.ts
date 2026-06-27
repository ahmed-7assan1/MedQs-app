import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const warning = await prisma.warning.findUnique({ where: { id: params.id } });
    if (!warning) {
      return NextResponse.json({ error: "Warning not found" }, { status: 404 });
    }

    if (body.action === "revoke") {
      const updated = await prisma.warning.update({
        where: { id: params.id },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedById: session.user.id,
          revokeReason: body.revokeReason ?? null,
        },
      });

      await prisma.user.update({
        where: { id: warning.userId },
        data: { warningCount: { decrement: 1 } },
      });

      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "WARNING",
        entityId: params.id,
        description: `Warning ${params.id} revoked`,
      });

      return NextResponse.json({ data: updated });
    }

    const updated = await prisma.warning.update({
      where: { id: params.id },
      data: {
        severity: body.severity ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("[PLATFORM_WARNING_PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
