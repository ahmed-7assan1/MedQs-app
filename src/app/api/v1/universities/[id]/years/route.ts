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

  const { yearNumber } = await req.json();
  const year = await prisma.academicYear.create({
    data: { yearNumber: Number(yearNumber), universityId: id },
  });
  return NextResponse.json(year, { status: 201 });
}
