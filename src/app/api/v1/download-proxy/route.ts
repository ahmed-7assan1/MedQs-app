import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 30; // Quick proxy

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    let finalUrl = url;
    if (finalUrl.startsWith('/')) {
       finalUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}${finalUrl}`;
    }

    console.log("[download-proxy] Attempting to fetch:", finalUrl);
    const res = await fetch(finalUrl, { redirect: 'follow', cache: 'no-store' });
    if (!res.ok) {
      console.error("[download-proxy] HTTP error from origin:", res.status, res.statusText);
      return NextResponse.json({ error: `Origin returned HTTP ${res.status}: ${res.statusText}` }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
       console.error("[download-proxy] Origin returned 0 bytes");
       return NextResponse.json({ error: `Origin returned an empty file (0 bytes)` }, { status: 502 });
    }

    console.log("[download-proxy] Successfully fetched", buffer.byteLength, "bytes");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=3600"
      }
    });

  } catch (error: any) {
    console.error("[api/v1/download-proxy]", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
