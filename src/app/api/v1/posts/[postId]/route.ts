import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user as any;
  const isAuthor = post.authorId === user.id;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN";
  
  // A semester admin is an ADMIN who belongs to the same university as the post.
  // Optionally, we could also check if user.semesterId === post.semesterId if posts were scoped to semesters.
  const isSemesterAdmin = isAdmin && (user.universityId === post.universityId);

  if (!isAuthor && !isSuperAdmin && !isSemesterAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.postId } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { interactionsDisabled } = await req.json();
  const updated = await prisma.post.update({
    where: { id: params.postId },
    data: { interactionsDisabled },
  });
  return NextResponse.json(updated);
}
