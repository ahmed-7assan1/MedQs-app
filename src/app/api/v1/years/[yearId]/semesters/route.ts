import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAcademicYear, requireAdminWriter } from "@/lib/admin-scope";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ yearId: string }> | { yearId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { yearId } = await Promise.resolve(ctx.params);
  const boundary = await assertAcademicYear(w.scope, yearId);
  if (boundary) return boundary;

  const { name } = await req.json();
  const semester = await prisma.semester.create({
    data: { name, academicYearId: yearId },
  });
  return NextResponse.json(semester, { status: 201 });
}
