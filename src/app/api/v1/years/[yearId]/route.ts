import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAcademicYearCascade } from "@/lib/admin-delete-structure";
import { assertAcademicYear, requireAdminWriter } from "@/lib/admin-scope";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { yearId: string } | Promise<{ yearId: string }> }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { yearId } = await Promise.resolve(params);
  if (!yearId?.trim()) return NextResponse.json({ error: "Missing yearId" }, { status: 400 });

  const boundary = await assertAcademicYear(w.scope, yearId.trim());
  if (boundary) return boundary;

  try {
    await prisma.$transaction((tx) => deleteAcademicYearCascade(tx, yearId.trim()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE academic year]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
