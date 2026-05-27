import { NextRequest, NextResponse } from "next/server";
import { getTelegramClient } from "@/lib/telegram-client";
import bigInt from "big-integer";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ... (cache definitions unchanged)
const urlCache = new Map<string, { cdnUrl: string; resolvedAt: number }>();
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes
const MAX_URL_CACHE = 500;

function extractMediaUrl(html: string): string | null {
  const patterns = [
    /<video[^>]+src=["']([^"']+)["']/i,
    /<source[^>]+src=["']([^"']+)["']/i,
    /<video[^>]+data-url=["']([^"']+)["']/i,
    /"url"\s*:\s*"(https:\/\/[^"]+\.(?:mp4|mov|webm|ogg)[^"]*)"/i,
    /src\s*=\s*["'](https:\/\/[^"']+\.(?:mp4|mov|webm|ogg)[^"']*)/i,
    /(https:\/\/cdn[^"'>\s]+\.(?:mp4|mov|webm))/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    }
  }

  const audioPatterns = [
    /<audio[^>]+src=["']([^"']+)["']/i,
    /"audio"\s*:\s*["']([^"']+)["']/i,
  ];
  for (const pattern of audioPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/&amp;/g, "&");
    }
  }

  return null;
}

async function resolveTelegramUrl(targetUrl: string): Promise<string | NextResponse | null> {
  const cached = urlCache.get(targetUrl);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL_MS) {
    return cached.cdnUrl;
  }

  const publicMatch = targetUrl.match(/t\.me\/([^/]+)\/(\d+)/i);
  if (!publicMatch) return null;

  const channel = publicMatch[1];
  const messageId = publicMatch[2];

  const embedUrls = [
    `https://t.me/${channel}/${messageId}?embed=1&single=1`,
    `https://t.me/${channel}/${messageId}?embed=1`,
  ];

  for (const embedUrl of embedUrls) {
    try {
      const embedRes = await fetch(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
        },
      });

      if (!embedRes.ok) continue;

      const html = await embedRes.text();
      
      if (html.includes("message_media_not_supported_label") || html.includes("Media is too big")) {
        return NextResponse.json(
          { error: "TELEGRAM_LIMIT_EXCEEDED", message: "Media is too big" },
          { status: 413 }
        );
      }

      const mediaUrl = extractMediaUrl(html);

      if (mediaUrl) {
        if (urlCache.size >= MAX_URL_CACHE) {
          const first = urlCache.keys().next().value;
          if (first) urlCache.delete(first);
        }
        urlCache.set(targetUrl, { cdnUrl: mediaUrl, resolvedAt: Date.now() });
        return mediaUrl;
      }
    } catch {
      // Try next URL
    }
  }

  return null;
}

/**
 * 📽️ MTProto Fallback Streamer
 * Streams chunks of the file directly from Telegram datacenters for videos > 50MB.
 */
async function streamViaMTProto(channel: string, messageId: number, rangeHeader: string | null): Promise<NextResponse> {
  try {
    const client = await getTelegramClient();
    const messages = await client.getMessages(channel, { ids: [messageId] });
    const msg = messages?.[0];

    if (!msg || !msg.media || !msg.media.className.includes("MessageMediaDocument")) {
      return NextResponse.json({ error: "No document found in MTProto" }, { status: 404 });
    }

    const document = (msg.media as any).document;
    if (!document) {
      return NextResponse.json({ error: "No document found" }, { status: 404 });
    }

    const totalSize = Number(document.size);
    let mimeType = document.mimeType || "video/mp4";

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

    // ReadableStream to pipe iterDownload to Next.js Response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of client.iterDownload({
            file: document,
            // @ts-ignore
            offset: bigInt(start),
            limit: chunkSize,
            requestSize: 1024 * 1024, // 1MB chunks
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const privateMatch = targetUrl.match(/t\.me\/c\/(-?\d+)\/(\d+)/i);
    if (privateMatch) {
      let chatId = privateMatch[1];
      const messageId = privateMatch[2];
      if (!chatId.startsWith("-100")) {
        chatId = `-100${chatId}`;
      }
      const proxyUrl = new URL(`/api/v1/telegram/video/${chatId}/${messageId}`, req.url);
      const res = await fetch(proxyUrl.toString(), {
        headers: req.headers,
        redirect: "follow",
      });
      return new NextResponse(res.body, {
        status: res.status,
        headers: new Headers(res.headers),
      });
    }

    const publicMatch = targetUrl.match(/t\.me\/([^/]+)\/(\d+)/i);
    if (!publicMatch) {
      return NextResponse.json({ error: "Invalid Telegram URL format" }, { status: 400 });
    }

    const channel = publicMatch[1];
    const messageId = parseInt(publicMatch[2], 10);
    const rangeHeader = req.headers.get("range");

    let cdnUrl = await resolveTelegramUrl(targetUrl);

    if (cdnUrl instanceof NextResponse) {
       // 🚨 MEDIA IS TOO BIG (>50MB) - Fallback to MTProto 🚨
       return await streamViaMTProto(channel, messageId, rangeHeader);
    }

    if (!cdnUrl) {
      return NextResponse.json(
        { error: "No video/audio found in this Telegram post. It may be private, deleted, or text-only." },
        { status: 404 }
      );
    }

    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: `https://t.me/${channel}/${messageId}?embed=1`,
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const mediaRes = await fetch(cdnUrl, { headers: fetchHeaders });

    if (!mediaRes.ok && mediaRes.status !== 206) {
      urlCache.delete(targetUrl);
      const freshCdnUrl = await resolveTelegramUrl(targetUrl);
      
      if (freshCdnUrl instanceof NextResponse) {
         return await streamViaMTProto(channel, messageId, rangeHeader);
      }

      if (!freshCdnUrl) {
        return NextResponse.json({ error: `CDN returned ${mediaRes.status}` }, { status: 502 });
      }
      
      const retryRes = await fetch(freshCdnUrl as string, { headers: fetchHeaders });
      if (!retryRes.ok && retryRes.status !== 206) {
        return NextResponse.json({ error: `CDN retry failed: ${retryRes.status}` }, { status: 502 });
      }
      return buildStreamResponse(retryRes, rangeHeader);
    }

    return buildStreamResponse(mediaRes, rangeHeader);
  } catch (error: any) {
    console.error("[Telegram Public Proxy Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream video" },
      { status: 500 }
    );
  }
}

function buildStreamResponse(mediaRes: Response, rangeHeader: string | null): NextResponse {
  const responseHeaders = new Headers({
    "Content-Type": mediaRes.headers.get("Content-Type") || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });

  const contentRange = mediaRes.headers.get("Content-Range");
  const contentLength = mediaRes.headers.get("Content-Length");
  if (contentRange) responseHeaders.set("Content-Range", contentRange);
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  return new NextResponse(mediaRes.body, {
    status: rangeHeader ? 206 : 200,
    headers: responseHeaders,
  });
}
