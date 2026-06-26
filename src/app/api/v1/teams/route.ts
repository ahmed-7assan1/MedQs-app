import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const teams = await prisma.medicalTeam.findMany({
      include: {
        faculty: { select: { name: true } },
        members: {
          where: { role: "LEADER" },
          include: { user: { select: { id: true, name: true, image: true } } },
          take: 1
        },
        _count: {
          select: { followers: true, posts: true, lectures: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET /api/v1/teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, imageUrl, facultyId, universityId, leaderEmail } = body;

    // ... existing uni/fac fallback logic ...
    let finalUniId = universityId;
    let finalFacId = facultyId;
    if (!finalUniId || !finalFacId) {
      const firstUni = await prisma.university.findFirst({ include: { faculties: true } });
      if (firstUni) {
        finalUniId = finalUniId || firstUni.id;
        finalFacId = finalFacId || firstUni.faculties[0]?.id;
      }
    }

    const team = await prisma.medicalTeam.create({
      data: {
        name,
        description,
        imageUrl,
        universityId: finalUniId,
        facultyId: finalFacId,
      }
    });

    // Handle Leader Assignment
    if (leaderEmail) {
      const leaderUser = await prisma.user.findUnique({ where: { email: leaderEmail } });
      if (leaderUser) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: leaderUser.id,
            role: "LEADER"
          }
        });
      }
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
