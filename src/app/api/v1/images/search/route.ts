import { NextRequest, NextResponse } from "next/server";

const DUCKDUCKGO_IMAGE_API = "https://duckduckgo.com/i.js";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q || typeof q !== "string") {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const maxResults = Math.min(Number(req.nextUrl.searchParams.get("max")) || 8, 20);

    const url = `${DUCKDUCKGO_IMAGE_API}?q=${encodeURIComponent(q)}&o=json&v=1&p=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Image search failed" }, { status: 502 });
    }

    const data = await res.json();
    const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const proxyUrl = (src: string) => `${origin}/api/v1/images/proxy?url=${encodeURIComponent(src)}`;

    const images: { url: string; thumbnail: string; title: string; source: string }[] = (data.results || [])
      .slice(0, maxResults)
      .map((r: any) => ({
        url: proxyUrl(r.image),
        thumbnail: r.thumbnail ? proxyUrl(r.thumbnail) : "",
        title: r.title,
        source: r.url,
      }));

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("[Image Search]", err?.message);
    return NextResponse.json({ error: err?.message || "Image search failed" }, { status: 500 });
  }
}
