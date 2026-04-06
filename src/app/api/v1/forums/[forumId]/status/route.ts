import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertForum, requireAdminWriter } from "@/lib/admin-scope";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ forumId: string }> | { forumId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { forumId } = await Promise.resolve(ctx.params);
  const boundary = await assertForum(w.scope, forumId);
  if (boundary) return boundary;

  const { status } = await req.json();
  const forum = await prisma.forum.update({
    where: { id: forumId },
    data: { status },
  });
  return NextResponse.json(forum);
}
