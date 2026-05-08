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

  // 4. Handle View/Stream (Proxy the content to avoid CORS/Redirect issues)
  try {
    const res = await fetch(telegramUrl);
    if (!res.ok) throw new Error("Failed to fetch from Telegram CDN");
    
    const blob = await res.blob();
    const headers = new Headers();
    
    if (isDownload) {
      // Try to extract filename from URL or use a default with correct extension
      const urlParts = telegramUrl.split("/");
      let fileName = urlParts[urlParts.length - 1] || "file";
      if (!fileName.includes(".")) {
        const ext = blob.type.split("/")[1] || "bin";
        fileName = `${fileName}.${ext}`;
      }
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    headers.set("Content-Type", blob.type);
    headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    return new NextResponse(blob, { headers });
  } catch (err: any) {
    console.error("[TG-PROXY] Fetch Error:", err);
    return NextResponse.redirect(telegramUrl); // Fallback to redirect if proxy fails
  }
}
