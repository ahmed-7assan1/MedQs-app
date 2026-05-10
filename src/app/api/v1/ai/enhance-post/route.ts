import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAIReplyWithFallback } from "@/lib/ai-router";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const systemPrompt = `You are a professional social media editor for a medical student community called MedOneX. 
    The student wants to enhance their post to be more professional, engaging, and clear. 
    - Maintain the original meaning and language.
    - If it's a question, make it sound inquisitive and smart.
    - If it's information, make it authoritative but friendly.
    - Add relevant emojis if appropriate (but don't overdo it).
    - Fix any grammar or spelling mistakes.
    - DO NOT add hashtags (the system adds them separately).
    - Return ONLY the enhanced content, with no introductory or concluding remarks.`;

    const result = await generateAIReplyWithFallback(
      `Please enhance this post content:\n\n${content}`,
      systemPrompt,
      { preferredProvider: "proxy" }
    );

    return NextResponse.json({ enhanced: result.text.trim() });
  } catch (error) {
    console.error("[enhance-post]", error);
    return NextResponse.json({ error: "Failed to enhance content" }, { status: 500 });
  }
}
