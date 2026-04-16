import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/tenant";

/**
 * POST /api/v1/admin/seed-faculties
 *
 * One-time migration: for every university that has no faculties yet,
 * creates a "Faculty of Medicine" and links all existing AcademicYears
 * (where facultyId is null) to it.
 *
 * SUPER_ADMIN only.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !isSuperAdmin(user.role)) {
      return NextResponse.json({ error: "SUPER_ADMIN only" }, { status: 403 });
    }

    // Fetch all universities
    const universities = await prisma.university.findMany({
      select: { id: true, name: true },
    });

    const results: Array<{ university: string; faculty: string; yearsUpdated: number }> = [];

    for (const uni of universities) {
      // Check if this university already has faculties
      const existingFaculties = await prisma.faculty.findMany({
        where: { universityId: uni.id },
        select: { id: true, name: true },
      });

      let facultyId: string;

      if (existingFaculties.length === 0) {
        // Create Faculty of Medicine
        const newFaculty = await prisma.faculty.create({
          data: { name: "Faculty of Medicine", universityId: uni.id },
        });
        facultyId = newFaculty.id;
      } else {
        // Use the first existing faculty (or find "Faculty of Medicine" if it exists)
        const medFaculty = existingFaculties.find(f =>
          f.name.toLowerCase().includes("medicine")
        ) ?? existingFaculties[0];
        facultyId = medFaculty.id;
      }

      // Update all AcademicYears for this university that have no faculty
      const updateResult = await prisma.academicYear.updateMany({
        where: { universityId: uni.id, facultyId: null },
        data: { facultyId },
      });

      results.push({
        university: uni.name,
        faculty: existingFaculties.length === 0 ? "Faculty of Medicine (created)" : `${existingFaculties[0].name} (existing)`,
        yearsUpdated: updateResult.count,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[seed-faculties]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
