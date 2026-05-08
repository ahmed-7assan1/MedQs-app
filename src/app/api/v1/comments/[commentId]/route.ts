import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await prisma.comment.findUnique({
    where: { id: params.commentId },
    select: { authorId: true, universityId: true },
  });

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user as any;
  const isAuthor = comment.authorId === user.id;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  const isSemesterAdmin = isAdmin && (user.universityId === comment.universityId);

  if (!isAuthor && !isSuperAdmin && !isSemesterAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ ok: true });
}
