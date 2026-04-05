import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteSemesterCascade } from "@/lib/admin-delete-structure";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { semesterId: string } | Promise<{ semesterId: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { semesterId } = await Promise.resolve(params);
  if (!semesterId?.trim()) return NextResponse.json({ error: "Missing semesterId" }, { status: 400 });

  try {
    await prisma.$transaction((tx) => deleteSemesterCascade(tx, semesterId.trim()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE semester]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
