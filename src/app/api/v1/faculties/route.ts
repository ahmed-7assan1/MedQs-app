import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

// GET /api/v1/faculties?universityId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get("universityId");

  const faculties = await prisma.faculty.findMany({
    where: universityId ? { universityId } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, logoUrl: true, universityId: true },
  });

  return NextResponse.json(faculties);
}

// POST /api/v1/faculties — Admin+ only
export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { name, universityId, logoUrl } = await req.json();
  if (!name?.trim() || !universityId) {
    return NextResponse.json({ error: "name and universityId are required" }, { status: 400 });
  }

  const faculty = await prisma.faculty.create({
    data: { name: name.trim(), universityId, logoUrl: logoUrl ?? null },
  });

  return NextResponse.json(faculty, { status: 201 });
}
