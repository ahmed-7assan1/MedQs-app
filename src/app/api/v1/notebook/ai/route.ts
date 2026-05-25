import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry, getGeminiApiKeys } from "@/lib/gemini-keys";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { lectureId, content, action } = await req.json();
    if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

    const keys = await getGeminiApiKeys(session.user.personalGeminiKey);
    if (keys.length === 0) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    if (action === "summarize") {
      const prompt = `Summarize the following medical student notes concisely. Focus on high-yield clinical facts and key concepts: \n\n${content}`;
      const result = await callGeminiWithRetry(async (key) => {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return await model.generateContent(prompt);
      }, session.user.personalGeminiKey);
      const summary = result.response.text();
      return NextResponse.json({ result: summary });
    } else if (action === "flashcards") {
      const prompt = `Turn the following medical notes into a set of 3-5 high-yield flashcards (Front and Back). Format as JSON array: [{"front": "...", "back": "..."}]. Notes: \n\n${content}`;
      const result = await callGeminiWithRetry(async (key) => {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return await model.generateContent(prompt);
      }, session.user.personalGeminiKey);
      const text = result.response.text();
      const jsonStr = text.match(/\[.*\]/s)?.[0] || text;
      const flashcards = JSON.parse(jsonStr);

      const createdCount = flashcards.length;

      return NextResponse.json({ count: createdCount, flashcards });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[notebook-ai-api] error:", error);
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }
}
