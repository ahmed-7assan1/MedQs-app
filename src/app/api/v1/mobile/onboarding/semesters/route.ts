import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");

    if (!academicYearId) {
      return NextResponse.json({ error: "academicYearId is required" }, { status: 400 });
    }

    const semesters = await prisma.semester.findMany({
      where: { academicYearId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(semesters);
  } catch (error) {
    console.error("Mobile Public Semesters Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
