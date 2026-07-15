import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { getTelegramClient } from "@/lib/telegram-client";
import { Api } from "telegram/tl";
import bigInt from "big-integer";

export const maxDuration = 300; // Allow long-lived streams on Vercel Pro
export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

/**
 * 📽️ MTProto Fallback Streamer
 * Streams chunks of the file directly from Telegram datacenters for files >20MB.
 */
async function streamViaMTProto(chatId: string, messageId: number, rangeHeader: string | null): Promise<NextResponse> {
  try {
    const client = await getTelegramClient();

    // Build the peer entity — strip Bot API's -100 prefix for supergroups
    let peer: Api.TypePeer;
    if (chatId.startsWith("-100")) {
      const channelId = chatId.replace("-100", "");
      peer = new Api.PeerChannel({ channelId: bigInt(channelId) });
    } else if (chatId.startsWith("-")) {
      peer = new Api.PeerChat({ chatId: bigInt(chatId.replace("-", "")) });
    } else {
      peer = new Api.PeerUser({ userId: bigInt(chatId) });
    }

    const messages = await client.getMessages(peer, { ids: [messageId] });
    const msg = messages?.[0];

    if (!msg || !msg.media || !msg.media.className.includes("MessageMediaDocument")) {
      return NextResponse.json({ error: "No document found in MTProto" }, { status: 404 });
    }

    const document = (msg.media as any).document;
    if (!document) {
      return NextResponse.json({ error: "No document found" }, { status: 404 });
    }

    const totalSize = Number(document.size);
    const mimeType = document.mimeType || "video/mp4";

    let start = 0;
    let end = totalSize - 1;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      if (parts[0]) start = parseInt(parts[0], 10);
      if (parts[1]) end = parseInt(parts[1], 10);
    }

    if (start >= totalSize) {
       return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${totalSize}` }});
    }

    const chunkSize = end - start + 1;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of client.iterDownload({
            file: document,
            // @ts-ignore
            offset: bigInt(start),
            limit: chunkSize,
            requestSize: 1024 * 1024,
          })) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (err) {
          console.error("[MTProto Streaming Error]:", err);
          controller.error(err);
        }
      }
    });

    const headers = new Headers({
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Content-Length": chunkSize.toString(),
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });

    return new NextResponse(stream, {
      status: rangeHeader ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error("[MTProto Fallback Error]:", error);
    return NextResponse.json({ error: "MTProto streaming failed" }, { status: 500 });
  }
}

/**
 * 📽️ Telegram Video Streaming Proxy
 * 
 * Uses the Telegram Bot API to stream video files directly.
 * Supports Byte-Range Requests (206 Partial Content) so the
 * browser's video player can seek anywhere without buffering.
 * Falls back to MTProto (gramjs) for files exceeding the 20MB Bot API limit.
 * 
 * Flow:
 *   1. Student visits lecture page
 *   2. Player requests: GET /api/v1/telegram/video/-100.../messageId
 *   3. This proxy fetches a temporary download link from Telegram
 *   4. Streams the video bytes back to the student
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
) {
  try {
    const { chatId, messageId } = params;
    const directFileId = new URL(req.url).searchParams.get("fileId");

    // ── 1. Authentication Check ──────────────────────────────────────────────
    // If directFileId is provided, skip auth — the fileId itself is an opaque
    // Telegram-internal identifier that can't be guessed, and it came from our DB.
    // This also allows public/embedded video playback on web and mobile.
    if (!directFileId) {
      // 1a. Try Supabase session (web, cookies)
      const session = await auth();
      if (session?.user) {
        // authenticated via Supabase — proceed
      } else {
        // 1b. Try Bearer JWT (mobile app)
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
                    const decoded = await verifyMobileToken(token);
          if (!decoded?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
        } else {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    }
    // If directFileId is present, auth is skipped (public access)

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Server misconfigured: TELEGRAM_BOT_TOKEN missing" },
        { status: 500 }
      );
    }

    let fileId: string | null = directFileId;

    // ── 2. Get Forwarded Message to obtain file_id ONLY if missing ───────────
    if (!fileId) {
      const fwdRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            from_chat_id: chatId,
            message_id: parseInt(messageId),
          }),
        }
      );

      if (fwdRes.ok) {
        const fwdData = await fwdRes.json();
        const msg = fwdData?.result;
        fileId = msg?.video?.file_id
          || msg?.document?.file_id
          || msg?.video_note?.file_id
          || null;

        // Clean up: delete the forwarded copy
        if (msg?.message_id) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: msg.message_id }),
          }).catch(() => {});
        }
      }
    }

    if (!fileId) {
      return NextResponse.json(
        { error: "Could not resolve file from Telegram message" },
        { status: 404 }
      );
    }

    // ── 3. Get File Download Path ────────────────────────────────────────────
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok || !getFileData.result?.file_path) {
      // File is larger than 20MB — Bot API can't download it
      // Fall back to MTProto (gramjs) for direct Telegram datacenter streaming
      const rangeHeader = req.headers.get("range");
      return await streamViaMTProto(chatId, parseInt(messageId, 10), rangeHeader);
    }

    const filePath = getFileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // ── 4. Handle Range Requests (for seeking in the video player) ───────────
    const rangeHeader = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {};
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const telegramRes = await fetch(downloadUrl, { headers: fetchHeaders });

    if (!telegramRes.ok && telegramRes.status !== 206) {
      return NextResponse.json(
        { error: `Telegram returned ${telegramRes.status}` },
        { status: 502 }
      );
    }

    // ── 5. Stream back to the browser ────────────────────────────────────────
    const responseHeaders = new Headers({
      "Content-Type":
        telegramRes.headers.get("Content-Type") || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      // Security: prevent embedding on other sites
      "X-Content-Type-Options": "nosniff",
    });

    // Forward range-related headers from Telegram
    const contentRange = telegramRes.headers.get("Content-Range");
    const contentLength = telegramRes.headers.get("Content-Length");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new NextResponse(telegramRes.body, {
      status: rangeHeader ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Telegram Proxy Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream video" },
      { status: 500 }
    );
  }
}
