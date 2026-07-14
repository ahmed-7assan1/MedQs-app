import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const saved = await prisma.savedPost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                handle: true,
                rank: { select: { label: true, badge: true } },
                university: { select: { name: true } },
              },
            },
            _count: { select: { likes: true, comments: true, savedBy: true } },
            forum: { select: { id: true, name: true } },
          },
        },
      },
    });

    const posts = saved.map((s) => ({
      id: s.post.id,
      content: s.post.content,
      imageUrl: s.post.imageUrl,
      attachments: s.post.attachments,
      createdAt: s.post.createdAt.toISOString(),
      author: {
        id: s.post.author.id,
        name: s.post.author.name,
        image: s.post.author.image,
        handle: s.post.author.handle,
        ...(s.post.author.rank ? { rank: s.post.author.rank } : {}),
        university: (s.post.author as any).university?.name ?? null,
      },
      _count: s.post._count,
      savedByMe: true,
      likedByMe: false,
      forum: s.post.forum,
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[V1_SAVED_POSTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
