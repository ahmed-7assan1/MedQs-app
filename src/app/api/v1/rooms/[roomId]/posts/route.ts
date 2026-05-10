import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { roomId: string } | Promise<{ roomId: string }> };

async function getRoomId(params: Params["params"]) {
  const p = await Promise.resolve(params);
  return p.roomId;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const roomId = await getRoomId(params);

  const isMember = await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const posts = await prisma.studyRoomPost.findMany({
    where: { roomId },
    include: { 
      author: { select: { id: true, name: true, image: true, rank: { select: { label: true, badge: true } } } },
      sharedQuestion: { select: { id: true, body: true, choices: true, correctAnswer: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId } }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const formattedPosts = posts.map(p => ({
    ...p,
    likedByMe: p.likes.length > 0,
    likes: undefined // cleanup
  }));

  return NextResponse.json(formattedPosts);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const roomId = await getRoomId(params);

  const isMember = await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const body = await req.json();
    const { content, attachments, sharedQuestion, imageUrl } = body;

    const post = await prisma.studyRoomPost.create({
      data: { 
        content: content?.trim() || "", 
        imageUrl: imageUrl?.trim(),
        attachments: attachments || undefined,
        roomId, 
        authorId: userId,
        ...(sharedQuestion ? {
          sharedQuestionId: sharedQuestion.id,
          sharedQuestionData: sharedQuestion
        } : {})
      },
      include: { 
        author: { select: { id: true, name: true, image: true, rank: { select: { label: true, badge: true } } } },
        sharedQuestion: { select: { id: true, body: true, choices: true, correctAnswer: true } },
        _count: { select: { likes: true, comments: true } }
      },
    });

    return NextResponse.json({ ...post, likedByMe: false }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create post", details: err.message }, { status: 500 });
  }
}
