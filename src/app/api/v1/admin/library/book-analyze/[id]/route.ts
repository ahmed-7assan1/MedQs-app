import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  try {
    const { id } = params;

    // Optional: Check if the book belongs to the same university/faculty if we want stricter isolation
    await (prisma as any).sourceBook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE source-book]", error);
    return NextResponse.json({ error: "Failed to delete source book" }, { status: 500 });
  }
}
