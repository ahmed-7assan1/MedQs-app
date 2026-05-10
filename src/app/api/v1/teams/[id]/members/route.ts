import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId: params.id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } }
      },
      orderBy: { role: 'asc' }
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leaderCheck = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: params.id, userId } }
    });

    const isGlobalAdmin = (session?.user as any)?.role === "ADMIN";
    if (!isGlobalAdmin && leaderCheck?.role !== "LEADER" && leaderCheck?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role } = await req.json();
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const newMember = await prisma.teamMember.create({
      data: {
        teamId: params.id,
        userId: targetUser.id,
        role: role || "MEMBER"
      },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } }
      }
    });

    return NextResponse.json(newMember);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
