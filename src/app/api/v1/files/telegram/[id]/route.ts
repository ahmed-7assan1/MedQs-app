import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFileLinkFromTelegram } from "@/lib/telegram-storage";

/**
 * GET /api/v1/files/telegram/[id]
 * Redirects the user to a fresh, temporary Telegram CDN link.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { searchParams } = new URL(req.url);
  const directFileId = searchParams.get("fileId");
  const session = await auth();
  
  // Allow access if session exists OR if it's a direct fileId request (for forum previews)
  if (!session?.user && !directFileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(ctx.params);

  let telegramFileId = directFileId;

  // 1. If no direct fileId, look up in DB
  if (!telegramFileId) {
    // Try to find in LectureFile
    let file = await (prisma.lectureFile as any).findUnique({
      where: { id },
      select: { telegramFileId: true }
    });

    // Try to find in LectureVideo
    if (!file || !file.telegramFileId) {
      const video = await (prisma.lectureVideo as any).findUnique({
        where: { id },
        select: { telegramFileId: true }
      });
      if (video) file = { telegramFileId: video.telegramFileId };
    }

    // Try to find in Post (if we add it later)
    if (!file || !file.telegramFileId) {
      const post = await (prisma.post as any).findUnique({
        where: { id },
        select: { telegramFileId: true }
      });
      if (post) file = { telegramFileId: post.telegramFileId };
    }

    telegramFileId = file?.telegramFileId;
  }

  if (!telegramFileId) {
    return NextResponse.json({ error: "File not found or not synced to Telegram" }, { status: 404 });
  }

  const isDownload = searchParams.get("download") === "true";

  // 3. Get fresh link from Telegram
  const telegramUrl = await getFileLinkFromTelegram(telegramFileId);
  if (!telegramUrl) {
    console.error("[TG-PROXY] Failed to get link for", telegramFileId);
    return NextResponse.json({ error: "Failed to retrieve link from Telegram" }, { status: 502 });
  }

    // 4. Handle View/Stream (Proxy the content with streaming for performance)
    const response = await fetch(telegramUrl);
    if (!response.ok) throw new Error("Failed to fetch from Telegram CDN");

    const { readable, writable } = new TransformStream();
    response.body?.pipeTo(writable);

    const headers = new Headers();
    if (isDownload) {
      const urlParts = telegramUrl.split("/");
      let fileName = urlParts[urlParts.length - 1] || "file";
      const contentType = response.headers.get("Content-Type") || "application/octet-stream";
      if (!fileName.includes(".")) {
        const ext = contentType.split("/")[1] || "bin";
        fileName = `${fileName}.${ext}`;
      }
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=3600");
    
    return new NextResponse(readable, { headers });
  } catch (err: any) {
    console.error("[TG-PROXY] Streaming Error:", err);
    return NextResponse.redirect(telegramUrl);
  }
}
