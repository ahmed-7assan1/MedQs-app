import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get("universityId");
    const facultyId = searchParams.get("facultyId");

    if (!universityId) {
      return NextResponse.json({ error: "universityId is required" }, { status: 400 });
    }

    const years = await prisma.academicYear.findMany({
      where: {
        universityId,
        ...(facultyId ? { facultyId } : {}),
      },
      orderBy: { yearNumber: "asc" },
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error("Mobile Public Years Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
