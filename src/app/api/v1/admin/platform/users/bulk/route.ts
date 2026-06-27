import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkActionUsers } from "@/lib/platform-users";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, userIds, payload } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "action, userIds (non-empty array) required" }, { status: 400 });
    }

    if (userIds.length > 500) {
      return NextResponse.json({ error: "Cannot bulk action more than 500 users at once" }, { status: 400 });
    }

    await bulkActionUsers({ action, userIds, payload, adminId: session.user.id });

    return NextResponse.json({ success: true, affectedCount: userIds.length });
  } catch (error: any) {
    console.error("[PLATFORM_USERS_BULK] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
