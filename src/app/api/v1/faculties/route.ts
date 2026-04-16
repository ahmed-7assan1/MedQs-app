import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

// GET /api/v1/faculties?universityId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get("universityId");

    const faculties = await prisma.faculty.findMany({
      where: universityId ? { universityId } : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true, logoUrl: true, universityId: true },
    });

    return NextResponse.json(faculties);
  } catch (err) {
    console.error("[GET /api/v1/faculties]", err);
    return NextResponse.json({ error: "Failed to load faculties" }, { status: 500 });
  }
}

// POST /api/v1/faculties — Admin+ only
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;

    const body = await req.json();
    const { name, universityId, logoUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Faculty name is required" }, { status: 400 });
    }
    if (!universityId) {
      return NextResponse.json({ error: "universityId is required" }, { status: 400 });
    }

    // Non-super-admin can only add faculties to their own university
    if (!w.isSuper && w.scope.universityId && w.scope.universityId !== universityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify university exists
    const uni = await prisma.university.findUnique({ where: { id: universityId }, select: { id: true } });
    if (!uni) {
      return NextResponse.json({ error: "University not found" }, { status: 404 });
    }

    const faculty = await prisma.faculty.create({
      data: { name: name.trim(), universityId, logoUrl: logoUrl ?? null },
    });

    return NextResponse.json(faculty, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/faculties]", err);
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
