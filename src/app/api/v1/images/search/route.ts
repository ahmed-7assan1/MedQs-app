import { NextRequest, NextResponse } from "next/server";

const DUCKDUCKGO_HTML = "https://html.duckduckgo.com/html";
const DUCKDUCKGO_IMAGE_API = "https://duckduckgo.com/i.js";

async function getVqdToken(query: string): Promise<string | null> {
  try {
    const res = await fetch(`${DUCKDUCKGO_HTML}?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/vqd=['"]?([a-zA-Z0-9_-]+)['"]?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function searchDuckDuckGo(query: string, max: number): Promise<string[]> {
  const tryFetch = async (url: string): Promise<string[]> => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const fixUrl = (src: string) => {
      if (!src) return null;
      const trimmed = src.trim();
      if (trimmed.startsWith("//")) return `https:${trimmed}`;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
      if (trimmed.startsWith("/")) return `https://duckduckgo.com${trimmed}`;
      return trimmed;
    };

    return (data.results || [])
      .slice(0, max)
      .map((r: any) => fixUrl(r.image))
      .filter(Boolean) as string[];
  };

  let results = await tryFetch(
    `${DUCKDUCKGO_IMAGE_API}?q=${encodeURIComponent(query)}&o=json&v=1&p=1`
  );

  if (results.length === 0) {
    const vqd = await getVqdToken(query);
    if (vqd) {
      results = await tryFetch(
        `${DUCKDUCKGO_IMAGE_API}?q=${encodeURIComponent(query)}&o=json&v=1&p=1&vqd=${vqd}`
      );
    }
  }

  return results;
}

async function searchWikimedia(query: string, max: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${max}&format=json&origin=*&srnamespace=6`,
      {
        headers: { "User-Agent": "MedOneX/1.0 (medical tutor app)" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const titles = (data.query?.search || []).map((r: any) => r.title);

    return titles
      .map((title: string) => {
        const filename = title.replace(/^File:/, "").trim();
        if (!filename) return null;
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
      })
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

async function searchUnsplash(query: string, max: number): Promise<string[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${max}&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || [])
      .map((r: any) => r.urls?.regular || r.urls?.raw)
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q || typeof q !== "string") {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const maxResults = Math.min(Number(req.nextUrl.searchParams.get("max")) || 8, 20);

    let images = await searchDuckDuckGo(q, maxResults);

    if (images.length === 0) {
      images = await searchWikimedia(q, maxResults);
    }

    if (images.length === 0) {
      images = await searchUnsplash(q, maxResults);
    }

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("[Image Search]", err?.message);
    return NextResponse.json({ error: err?.message || "Image search failed" }, { status: 500 });
  }
}
