import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { generateJsonWithFallback } from "@/lib/ai-router";
import { unifiedResolveKey } from "@/lib/unified-key-resolver";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { input } = await req.json();
    if (!input) return NextResponse.json({ error: "Input is required" }, { status: 400 });

    let textToAnalyze = input;
    let foundUrls: string[] = [];
    let extractedLinks: { text: string, url: string }[] = [];

    // If it's a telegram link, scrape it
    if (input.includes("t.me/")) {
      try {
        const tmeUrl = new URL(input);
        const embedUrl = `https://t.me/${tmeUrl.pathname.replace(/^\//, '')}?embed=1`;
        
        const response = await fetch(embedUrl);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Preserve line breaks
        $('.tgme_widget_message_text br').replaceWith('\n');

        const messageText = $('.tgme_widget_message_text').text();
        textToAnalyze = messageText || input;

        // Find links in message text
        $('.tgme_widget_message_text a').each((_, el) => {
           const href = $(el).attr('href');
           const text = $(el).text().trim();
           if (href && !href.startsWith('tg://')) {
               extractedLinks.push({ text, url: href });
               if (!foundUrls.includes(href)) foundUrls.push(href);
           }
        });

        // Find links in inline keyboards (buttons)
        $('.tgme_widget_message_inline_keyboard a').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && !href.startsWith('tg://')) {
                extractedLinks.push({ text: `[Button] ${text}`, url: href });
                if (!foundUrls.includes(href)) foundUrls.push(href);
            }
        });
        
        // Also extract any raw URLs that weren't wrapped in <a>
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = messageText.match(urlRegex);
        if (matches) {
            matches.forEach(m => {
                if (!foundUrls.includes(m)) {
                    foundUrls.push(m);
                    extractedLinks.push({ text: "Raw URL", url: m });
                }
            });
        }

        // If it's a video/doc post itself and no other links were found
        if ($('.tgme_widget_message_video').length > 0 || $('.tgme_widget_message_document').length > 0) {
           if (!foundUrls.includes(input)) {
               foundUrls.push(input);
               extractedLinks.push({ text: "Main Post Media", url: input });
           }
        }
      } catch (e) {
        console.error("Failed to scrape telegram link", e);
      }
    } else {
        // Simple regex to extract urls from raw text
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = textToAnalyze.match(urlRegex);
        if (matches) {
            matches.forEach((m: any) => {
                foundUrls.push(m);
                extractedLinks.push({ text: "Text Link", url: m });
            });
        }
    }

    if (foundUrls.length === 0 && !input.includes("t.me/")) {
        foundUrls.push(input);
        extractedLinks.push({ text: "Raw Input", url: input });
    }

    // Define the AI Prompt
    const prompt = `
You are an AI assistant helping a medical platform administrator organize content.
The user provided the following text (which might be a Telegram message):

"""
${textToAnalyze}
"""

We found the following specific links with their anchor text:
${JSON.stringify(extractedLinks, null, 2)}

Original Input:
${input}

Analyze the data and extract EVERY single link/resource mentioned.
CRITICAL INSTRUCTIONS:
- You MUST return an item for EACH distinct link found.
- Use the provided "text" in the JSON above as the primary source for the "title" of each resource.
- If a link has text like "L8: Pelvic Peritoneum", use that as the title.
- If there are 20 links, return 20 objects.
- If the Original Input is a telegram post itself and contains no text links, return the telegram post as the resource.

For each resource, determine:
1. "type": "video" or "file" (PDFs, docs). Default to "video" if unsure.
2. "title": A concise, clear title based on the link text or surrounding context.
3. "sourceUrl": The specific URL of the resource.
4. "scope": Best guess for where it belongs in the curriculum hierarchy based on the text:
   - "course": string or null
   - "subject": string or null
   - "module": string or null
   - "lecture": string or null

Respond ONLY with a valid JSON array of objects representing the resources. Do not include markdown formatting or extra text.
`;

    // Resolve admin's personal/org key for the AI call
    const userWithKeys = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { adminAiKeys: true },
    });
    const unifiedKey = userWithKeys ? unifiedResolveKey(userWithKeys as any, "gemini", { preferAdmin: true }) : null;

    // Now call AI Router with Fallback (MANUS -> Gemini -> Others)
    const { data: items, provider } = await generateJsonWithFallback(prompt, [] as any[], unifiedKey ? {
      personalKey: unifiedKey.key,
      useCustomKey: true,
      customProvider: "gemini",
      preferredProvider: "gemini",
    } : {});

    if (!items || !Array.isArray(items)) {
      console.log("Failed to get items from AI Router", provider);
      return NextResponse.json({ error: "AI analysis returned no valid items" }, { status: 500 });
    }

    // Duplicate check
    for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'video') {
           const existing = await prisma.lectureVideo.findFirst({
               where: { url: { contains: items[i].sourceUrl } },
               include: { lecture: { select: { title: true } } }
           });
           if (existing) {
               items[i].duplicate = true;
               items[i].existingLocation = existing.lecture?.title || "Unknown Lecture";
           } else {
               items[i].duplicate = false;
           }
        }
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("AI Analyze Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
