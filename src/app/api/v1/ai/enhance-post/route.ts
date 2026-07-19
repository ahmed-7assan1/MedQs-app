import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBestKey } from "@/lib/byok-resolver";
import { fetchWithFallback } from "@/lib/ai-fetcher";
import { PROVIDERS } from "@/lib/providers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content, personalKey } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const provider = "siliconflow";

    let apiKey = personalKey?.trim() || null;
    if (!apiKey) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { adminAiKeys: true },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const resolved = resolveBestKey(user, provider);
      apiKey = resolved?.key ?? null;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for ${provider}. Add one in Settings → AI` },
        { status: 400 }
      );
    }

    const config = PROVIDERS[provider as keyof typeof PROVIDERS];
    const model = config?.defaultModel || "deepseek-ai/DeepSeek-R1";

    const systemPrompt = `You are a professional social media editor for a medical student community called MedOneX. 
    The student wants to enhance their post to be more professional, engaging, and clear. 
    - Maintain the original meaning and language.
    - If it's a question, make it sound inquisitive and smart.
    - If it's information, make it authoritative but friendly.
    - Add relevant emojis if appropriate (but don't overdo it).
    - Fix any grammar or spelling mistakes.
    - DO NOT add hashtags (the system adds them separately).
    - Return ONLY the enhanced content, with no introductory or concluding remarks.`;

    const text = await fetchWithFallback(
      session.user.id,
      provider,
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please enhance this post content:\n\n${content}` },
      ],
      apiKey
    );

    return NextResponse.json({ enhanced: text.trim() });
  } catch (error) {
    console.error("[enhance-post]", error);
    return NextResponse.json({ error: "Failed to enhance content" }, { status: 500 });
  }
}
