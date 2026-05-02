import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = params.id;

  try {
    const existingFollow = await prisma.teamFollower.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.teamFollower.delete({
        where: { id: existingFollow.id },
      });
      
      // Update count
      await prisma.medicalTeam.update({
        where: { id: teamId },
        data: { followersCount: { decrement: 1 } }
      });

      return NextResponse.json({ following: false });
    } else {
      // Follow
      await prisma.teamFollower.create({
        data: {
          teamId,
          userId,
        },
      });

      // Update count
      await prisma.medicalTeam.update({
        where: { id: teamId },
        data: { followersCount: { increment: 1 } }
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("[TeamFollow]", error);
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
