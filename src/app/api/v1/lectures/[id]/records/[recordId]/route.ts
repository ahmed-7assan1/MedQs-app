import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const scope = await getSessionScope(session);
    if (!isAdminRole(scope?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, recordId } = params;

    const record = await prisma.lectureRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.lectureId !== id) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.lectureRecord.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[RECORD_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
