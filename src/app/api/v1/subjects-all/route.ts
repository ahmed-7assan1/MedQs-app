import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/v1/subjects-all
export async function GET() {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(subjects);
}
