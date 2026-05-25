import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(url);
    const res = await fetch(decoded, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://medonex.app/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Type": contentType,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch {
    // Return a colored placeholder as fallback
    const color = req.nextUrl.searchParams.get("fallback") || "e2e8f0";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#${color}" width="400" height="400"/><text x="200" y="180" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16">Image unavailable</text><text x="200" y="210" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13">Click to search alternative</text></svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}

export const config = { runtime: "edge" };
