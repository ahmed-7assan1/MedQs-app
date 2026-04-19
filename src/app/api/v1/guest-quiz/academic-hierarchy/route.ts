import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const universities = await prisma.university.findMany({
      include: {
        faculties: {
          include: {
            academicYears: {
              include: {
                semesters: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(universities);
  } catch (error) {
    console.error("[GET academic-hierarchy]", error);
    return NextResponse.json({ error: "Failed to fetch hierarchy" }, { status: 500 });
  }
}
