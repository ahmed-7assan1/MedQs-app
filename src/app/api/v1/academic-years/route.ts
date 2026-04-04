import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const years = await prisma.academicYear.findMany({ orderBy: { yearNumber: "asc" } });
  return NextResponse.json(years);
}
