import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 300; // Allow long streams on Vercel Pro
export const dynamic = "force-dynamic";

/**
 * 📽️ Telegram Public Link Streaming Proxy
 * 
 * Takes an arbitrary Telegram post URL (e.g. https://t.me/channel/123)
 * - If private (t.me/c/chatId/msgId), redirects/proxies to our Bot API proxy.
 * - If public, scrapes the embed page, extracts the Telesco.pe CDN link,
 *   and streams it with HTTP 206 Byte-Range support!
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // ── 1. Check if Private Channel Link ────────────────────────────────────
    // Matches: https://t.me/c/1234567/89
    const privateMatch = targetUrl.match(/t\.me\/c\/(-?\d+)\/(\d+)/i);
    if (privateMatch) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      let chatId = privateMatch[1];
      const messageId = privateMatch[2];
      // Format chat id to supergroup format if it is positive
      if (!chatId.startsWith("-100")) {
        chatId = `-100${chatId}`;
      }
      
      // Rewrite to our bot-based proxy which supports range requests
      const proxyUrl = new URL(`/api/v1/telegram/video/${chatId}/${messageId}`, req.url);
      
      // Forward the range header
      const headers = new Headers(req.headers);
      
      const res = await fetch(proxyUrl.toString(), {
        headers: headers,
        redirect: 'follow'
      });

      const responseHeaders = new Headers(res.headers);
      return new NextResponse(res.body, {
        status: res.status,
        headers: responseHeaders
      });
    }

    // ── 2. Check if Public Channel Link ─────────────────────────────────────
    // Matches: https://t.me/channel_name/123
    const publicMatch = targetUrl.match(/t\.me\/([^/]+)\/(\d+)/i);
    if (publicMatch) {
      const channel = publicMatch[1];
      const messageId = publicMatch[2];
      
      // Fetch the embed HTML from Telegram
      const embedUrl = `https://t.me/${channel}/${messageId}?embed=1`;
      const embedRes = await fetch(embedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      if (!embedRes.ok) {
        return NextResponse.json({ error: "Failed to fetch embed page" }, { status: embedRes.status });
      }
      
      const html = await embedRes.text();
      
      // Scrape the `<video>` or `<source>` src attribute which points to telesco.pe CDN
      const videoMatch = html.match(/<video[^>]*src="([^"]+)"/i) || html.match(/<source[^>]*src="([^"]+)"/i);
      let mediaUrl = videoMatch ? videoMatch[1] : null;
      
      // Fallback: If no video, check if it's an audio message
      if (!mediaUrl) {
         const audioMatch = html.match(/<audio[^>]*src="([^"]+)"/i);
         if (audioMatch) mediaUrl = audioMatch[1];
      }

      if (!mediaUrl) {
        // Post might not contain video, or it's deleted/private
        return NextResponse.json({ error: "No video/audio found in the provided post" }, { status: 404 });
      }
      
      // Handle HTML entities in URL
      mediaUrl = mediaUrl.replace(/&amp;/g, '&');

      // ── 3. Stream the Media via Telesco.pe ─────────────────────────────────
      // We must forward Range headers to support seeking!
      const rangeHeader = req.headers.get("range");
      const fetchHeaders: Record<string, string> = {};
      if (rangeHeader) {
        fetchHeaders["Range"] = rangeHeader;
      }
      // Pretend to be a browser
      fetchHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      fetchHeaders["Referer"] = embedUrl;

      const mediaRes = await fetch(mediaUrl, { headers: fetchHeaders });
      
      if (!mediaRes.ok && mediaRes.status !== 206) {
         return NextResponse.json({ error: `Telegram CDN returned ${mediaRes.status}` }, { status: 502 });
      }

      // Forward headers back to client
      const responseHeaders = new Headers({
        "Content-Type": mediaRes.headers.get("Content-Type") || "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff"
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

    return NextResponse.json({ error: "Invalid Telegram URL format" }, { status: 400 });
  } catch (error: any) {
    console.error("[Telegram Public Proxy Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream video" },
      { status: 500 }
    );
  }
}
