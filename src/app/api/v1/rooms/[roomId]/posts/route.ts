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
      sharedQuestion: { select: { id: true, body: true, choices: true, answer: true } },
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
    const { 
      content, attachments, sharedQuestion, imageUrl,
      poll,           // { question: string; options: string[] }
      postType,       // "post" | "poll" | "qa"
      qaAnswer,       // string — the correct answer text for Q&A type
      qaOptions,      // string[] — wrong + correct choices for Q&A
      telegramAudioUrl, // direct t.me or file URL for voice note
    } = body;

    // Build the attachments array, injecting Telegram audio if provided
    let finalAttachments = attachments || [];
    if (telegramAudioUrl?.trim()) {
      finalAttachments = [
        ...finalAttachments,
        { type: "telegram_audio", url: telegramAudioUrl.trim() }
      ];
    }

    // Build extras JSON for poll / Q&A stored as attachment metadata
    let extras: any = {};
    let createdPollId: string | undefined = undefined;
    if ((postType === "poll" || postType === "qa") && poll?.question && Array.isArray(poll.options) && poll.options.length >= 2) {
      // Create independent poll record
      const newPoll = await prisma.poll.create({
        data: {
          question: poll.question,
          options: {
            create: poll.options.map((text: string) => ({ text }))
          }
        }
      });
      createdPollId = newPoll.id;

      extras.poll = {
        question: poll.question,
        options: poll.options.filter((o: string) => o.trim()),
        type: postType,
        correctAnswer: postType === "qa" ? (qaAnswer?.trim() || null) : null,
        votes: {}
      };
    }

    const post = await prisma.studyRoomPost.create({
      data: { 
        content: content?.trim() || "", 
        imageUrl: imageUrl?.trim() || undefined,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
        // Store poll/qa data inside sharedQuestionData JSON field (reusing existing column)
        sharedQuestionData: Object.keys(extras).length > 0 ? extras : undefined,
        roomId, 
        authorId: userId,
        ...(sharedQuestion?.id ? {
          sharedQuestionId: sharedQuestion.id,
          sharedQuestionData: { ...extras, sharedQuestion }
        } : {})
      },
      include: { 
        author: { select: { id: true, name: true, image: true, rank: { select: { label: true, badge: true } } } },
        sharedQuestion: { select: { id: true, body: true, choices: true, answer: true } },
        _count: { select: { likes: true, comments: true } }
      },
    });

    return NextResponse.json({ ...post, likedByMe: false }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create post", details: err.message }, { status: 500 });
  }
}
