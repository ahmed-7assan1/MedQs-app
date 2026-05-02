import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const teams = await prisma.medicalTeam.findMany({
      include: {
        faculty: { select: { name: true } },
        _count: {
          select: { followers: true, posts: true, lectures: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN" && (session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, imageUrl, facultyId, universityId } = body;

    // Fallbacks if not provided (MedicalTeam requires these)
    let finalUniId = universityId;
    let finalFacId = facultyId;

    if (!finalUniId || !finalFacId) {
      const firstUni = await prisma.university.findFirst({
        include: { faculties: true }
      });
      if (firstUni) {
        finalUniId = finalUniId || firstUni.id;
        finalFacId = finalFacId || firstUni.faculties[0]?.id;
      }
    }

    if (!finalUniId || !finalFacId) {
      return NextResponse.json({ error: "University and Faculty are required" }, { status: 400 });
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

    return NextResponse.json(team);
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
