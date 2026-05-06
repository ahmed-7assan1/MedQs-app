import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateJsonWithFallback, AIProviderId } from "@/lib/ai-router";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { 
      text, 
      urls = [], 
      provider, 
      customKey, 
      customProvider, 
      useCustomKey 
    } = await req.json();

    if (!text && urls.length === 0) {
      return NextResponse.json({ error: "Provide text or URLs to scrape" }, { status: 400 });
    }

    // 1. Deep Scraping: Fetch content from provided URLs in the background
    let scrapedContent = "";
    for (const url of urls) {
      try {
        if (!url.startsWith("http")) continue;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);
          // Remove scripts and styles
          $("script, style, noscript, iframe, img, svg").remove();
          const pageText = $("body").text().replace(/\s+/g, " ").trim();
          scrapedContent += `\n\n--- Content from ${url} ---\n${pageText.substring(0, 5000)}`; // limit per URL
        }
      } catch (err) {
        console.warn(`Failed to scrape ${url}:`, err);
      }
    }

    const fullContext = `
      Original Input:
      ${text}

      Scraped Web Context:
      ${scrapedContent}
    `;

    // 2. AI Architecture Generation
    const systemPrompt = `
      You are an expert Medical Curriculum Architect.
      Analyze the provided text and scraped web content.
      Extract all relevant educational resources, topics, and structures.
      Build a logical module/semester architecture.
      Generate 3 sample flashcards and 3 sample multiple-choice questions based on the deep scraped content.
      Return ONLY a valid JSON object matching this schema:
      {
        "moduleTitle": "string",
        "description": "string",
        "extractedTopics": ["string"],
        "linksFound": ["string"],
        "sampleFlashcards": [{ "front": "string", "back": "string" }],
        "sampleQuestions": [{ "body": "string", "options": ["string", "string", "string", "string"], "answer": "string (the exact option)" }]
      }
    `;

    const { data, provider: usedProvider } = await generateJsonWithFallback(
      fullContext,
      {
        moduleTitle: "Failed to parse",
        description: "",
        extractedTopics: [],
        linksFound: [],
        sampleFlashcards: [],
        sampleQuestions: []
      },
      {
        systemPrompt,
        preferredProvider: provider as AIProviderId,
        personalKey: customKey,
        customProvider,
        useCustomKey
      }
    );

    return NextResponse.json({
      success: true,
      provider: usedProvider,
      architecture: data
    });

  } catch (error: any) {
    console.error("[scrape-links] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
