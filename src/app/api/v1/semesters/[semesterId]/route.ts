import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteSemesterCascade } from "@/lib/admin-delete-structure";
import { assertSemester, requireAdminWriter } from "@/lib/admin-scope";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { semesterId: string } | Promise<{ semesterId: string }> }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { semesterId } = await Promise.resolve(params);
  if (!semesterId?.trim()) return NextResponse.json({ error: "Missing semesterId" }, { status: 400 });

  const boundary = await assertSemester(w.scope, semesterId.trim());
  if (boundary) return boundary;

  try {
    await prisma.$transaction((tx) => deleteSemesterCascade(tx, semesterId.trim()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE semester]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
