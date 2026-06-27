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
    const { status, resolution } = body;

    const updated = await prisma.securityEvent.update({
      where: { id: params.id },
      data: {
        status: status ?? undefined,
        resolution: resolution ?? undefined,
        resolvedById: status === "RESOLVED" || status === "FALSE_POSITIVE" || status === "IGNORED"
          ? session.user.id : undefined,
        resolvedAt: status === "RESOLVED" || status === "FALSE_POSITIVE" || status === "IGNORED"
          ? new Date() : undefined,
      },
    });

    await logAdminAction({
      adminId: session.user.id,
      action: "UPDATE",
      entityType: "REPORT",
      entityId: params.id,
      description: `Security event ${params.id} updated to ${status}`,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("[PLATFORM_SECURITY_EVENT_PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
