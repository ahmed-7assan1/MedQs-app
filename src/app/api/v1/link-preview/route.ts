import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MedOneX/1.0)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();

    const og: Record<string, string> = {};
    const ogRegex = /<meta\s+(?:property|name)=["'](?:og:)?([^"']+)["']\s+content=["']([^"']+)["']/gi;
    let match;
    while ((match = ogRegex.exec(html)) !== null) {
      og[match[1]] = match[2];
    }

    const title =
      og.title ||
      html.match(/<title>([^<]*)<\/title>/i)?.[1] ||
      parsed.hostname;
    const description = og.description || "";
    const image = og.image || "";
    const favicon = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      favicon,
      domain: parsed.hostname,
      url: parsed.origin + parsed.pathname,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 422 });
  }
}
