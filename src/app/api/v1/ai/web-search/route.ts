import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { query, maxResults = 5 } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Search DuckDuckGo HTML
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: 502 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const results: { title: string; snippet: string; url: string }[] = [];
    $(".result").each((_, el) => {
      if (results.length >= maxResults) return;
      const title = $(el).find(".result__title a").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      const url = $(el).find(".result__url").text().trim() || $(el).find(".result__title a").attr("href") || "";
      if (title) results.push({ title, snippet, url });
    });

    // Scrape content from top results
    let combinedContent = `Web search results for: "${query}"\n\n`;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      combinedContent += `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}\n\n`;

      // Try to get full content from the page
      if (r.url.startsWith("http")) {
        try {
          const pageRes = await fetch(r.url, { signal: AbortSignal.timeout(5000) });
          if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            const $page = cheerio.load(pageHtml);
            $page("script, style, nav, header, footer, iframe").remove();
            const bodyText = $page("body").text().replace(/\s+/g, " ").trim().substring(0, 3000);
            if (bodyText.length > 200) {
              combinedContent += `Excerpt: ${bodyText.substring(0, 2000)}\n\n`;
            }
          }
        } catch {}
      }
    }

    return NextResponse.json({ results: combinedContent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Search failed" }, { status: 500 });
  }
}
