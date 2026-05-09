import { NextRequest, NextResponse } from "next/server";
import { getFileLinkFromTelegram } from "@/lib/telegram-storage";

/**
 * GET /api/v1/files/telegram/preview?fileId=XXX&type=image|audio|file
 * Streams the file from Telegram CDN. No DB lookup needed — fileId is provided directly.
 * Used by forum attachments, community chat, and voice recordings.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const isDownload = searchParams.get("download") === "true";

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  // Get a fresh, time-limited direct link from Telegram
  const telegramUrl = await getFileLinkFromTelegram(fileId);
  if (!telegramUrl) {
    return NextResponse.json({ error: "Failed to retrieve link from Telegram" }, { status: 502 });
  }

  try {
    const response = await fetch(telegramUrl);
    if (!response.ok) throw new Error(`Telegram CDN responded with ${response.status}`);

    const { readable, writable } = new TransformStream();
    response.body?.pipeTo(writable);

    const headers = new Headers();
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=1800"); // 30 min cache
    headers.set("Access-Control-Allow-Origin", "*");

    if (isDownload) {
      const urlParts = telegramUrl.split("/");
      const fileName = urlParts[urlParts.length - 1] || `file.${contentType.split("/")[1] || "bin"}`;
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    return new NextResponse(readable, { headers });
  } catch (err: any) {
    console.error("[TG-PREVIEW] Error streaming:", err.message);
    // Fallback to redirect
    return NextResponse.redirect(telegramUrl);
  }
}
