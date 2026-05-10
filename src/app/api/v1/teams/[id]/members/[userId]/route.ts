import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string, userId: string } }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leaderCheck = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.id, userId: currentUserId } }
    });

    const isGlobalAdmin = (session?.user as any)?.role === "ADMIN";
    if (!isGlobalAdmin && leaderCheck?.role !== "LEADER" && leaderCheck?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: params.id, userId: params.userId } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
