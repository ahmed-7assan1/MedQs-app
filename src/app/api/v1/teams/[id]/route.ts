import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const team = await prisma.medicalTeam.findUnique({
      where: { id: params.id },
      include: {
        faculty: { select: { name: true } },
        university: { select: { name: true } },
        _count: {
          select: {
            followers: true,
            lectures: true,
            posts: true,
            members: true,
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    let isFollowing = false;
    let myRole: string | null = null;

    if (userId) {
      const [follow, membership] = await Promise.all([
        prisma.teamFollower.findUnique({
          where: {
            teamId_userId: {
              teamId: params.id,
              userId: userId,
            }
          }
        }),
        prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: params.id,
              userId: userId,
            }
          },
          select: { role: true }
        })
      ]);
      isFollowing = !!follow;
      myRole = membership?.role || null;
    }

    return NextResponse.json({
      ...team,
      isFollowing,
      myRole,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.id,
          userId: userId,
        }
      }
    });

    const role = (session?.user as any)?.role;
    const isGlobalAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isTeamAdmin = membership?.role === "LEADER" || membership?.role === "ADMIN";

    if (!isGlobalAdmin && !isTeamAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, imageUrl, coverUrl } = body;

    const updatedTeam = await prisma.medicalTeam.update({
      where: { id: params.id },
      data: {
        name,
        description,
        imageUrl,
        coverUrl,
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
