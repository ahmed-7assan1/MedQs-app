import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/v1/subjects/:subjectId/lectures is in subjects/[subjectId]/lectures
// This file handles /api/v1/subjects-all which is a separate route

// This route handles creating subjects — already done in modules/[moduleId]/subjects
// Adding a GET here for completeness

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");
  const subjects = await prisma.subject.findMany({
    where: moduleId ? { moduleId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}
