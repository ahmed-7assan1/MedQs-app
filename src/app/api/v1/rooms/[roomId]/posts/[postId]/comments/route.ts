import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { roomId: string; postId: string } | Promise<{ roomId: string; postId: string }> };

async function getParams(params: Params["params"]) {
  return await Promise.resolve(params);
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { roomId, postId } = await getParams(params);

  // Verify membership
  const isMember = await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId: session.user.id } } });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const comments = await prisma.studyRoomComment.findMany({
    where: { postId, parentId: null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { roomId, postId } = await getParams(params);

  // Verify membership
  const isMember = await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const { content, attachments, parentId } = await req.json();
    const comment = await prisma.studyRoomComment.create({
      data: {
        content: content || "",
        attachments: attachments || undefined,
        postId,
        authorId: userId,
        parentId
      },
      include: {
        author: { select: { id: true, name: true, image: true } }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create comment", details: err.message }, { status: 500 });
  }
}
