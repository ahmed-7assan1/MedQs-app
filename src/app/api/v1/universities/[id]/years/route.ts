import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameUniversity, requireAdminWriter } from "@/lib/admin-scope";

// ─── /api/v1/universities/[id]/years ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertSameUniversity(w.scope, id);
  if (boundary) return boundary;

  const { yearNumber, facultyId } = await req.json();

  // Validate facultyId if provided
  if (facultyId) {
    const fac = await prisma.faculty.findFirst({
      where: { id: facultyId, universityId: id },
      select: { id: true },
    });
    if (!fac) {
      return NextResponse.json({ error: "Faculty not found in this university" }, { status: 400 });
    }
  }

  // Check for duplicate
  const existing = await prisma.academicYear.findFirst({
    where: {
      universityId: id,
      yearNumber: Number(yearNumber),
      facultyId: facultyId ?? null,
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Year ${yearNumber} already exists${facultyId ? " in this faculty" : ""}` },
      { status: 409 }
    );
  }

  try {
    const year = await prisma.academicYear.create({
      data: {
        yearNumber: Number(yearNumber),
        universityId: id,
        ...(facultyId ? { facultyId } : {}),
      },
    });
    return NextResponse.json(year, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Year already exists" }, { status: 409 });
    }
    console.error("[POST /years]", err);
    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }
}
