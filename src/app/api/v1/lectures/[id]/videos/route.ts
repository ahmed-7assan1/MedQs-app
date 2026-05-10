import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { syncFileToTelegram } from "@/lib/telegram-storage";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.userId;
  const { id } = await Promise.resolve(ctx.params);
  if (!isSuperAdmin(scope.role)) {
    const boundary = await assertLecture(scope as any, id);
    if (boundary) return boundary;
  }
  const videos = await prisma.lectureVideo.findMany({
    where: { lectureId: id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      likes: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });
  return NextResponse.json(
    videos.map((v) => ({
      ...v,
      url: v.telegramFileId ? `/api/v1/files/telegram/${v.id}` : v.url,
      likedByMe: userId ? (v.likes as { id: string }[]).length > 0 : false,
      likes: undefined,
    }))
  );
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!title || !url) return NextResponse.json({ error: "title and url are required" }, { status: 400 });

  const sortOrder = await prisma.lectureVideo.count({ where: { lectureId: id } });
  
  // Optional: Sync to Telegram if it's a direct link
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const tgSync = !isYoutube ? await syncFileToTelegram(url, title, "video/mp4") : null;

  const row = await prisma.lectureVideo.create({
    data: {
      lectureId: id,
      title,
      url,
      sortOrder: sortOrder + 1,
      sharingEnabled: body?.sharingEnabled !== false,
      telegramMessageId: tgSync?.messageId,
      telegramChatId: tgSync?.chatId,
      telegramFileId: tgSync?.fileId,
    },
  });

  // Trigger Broadcast to Team Group
  const { broadcastToTeamTelegram } = await import("@/lib/broadcast");
  await broadcastToTeamTelegram({
    type: 'video',
    id: row.id,
    title,
    lectureId: id
  });

  // If it's YouTube, create a background migration task for Colab
  if (isYoutube) {
    try {
      await prisma.telegramMigrationTask.create({
        data: {
          title,
          sourceUrl: url,
          lectureVideoId: row.id,
          status: 'PENDING'
        }
      });
      console.log(`[MIGRATION] Created task for YouTube video: ${title}`);
    } catch (err) {
      console.error("[MIGRATION] Failed to create task:", err);
    }
  }

  return NextResponse.json({ ...row, likedByMe: false }, { status: 201 });
}

