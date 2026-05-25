import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry, getGeminiApiKeys } from "@/lib/gemini-keys";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { answer } = await req.json();
    if (!answer) {
      return NextResponse.json({ error: "No answer provided" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: params.id },
    });

    if (!question || question.questionType !== "ESSAY" || !question.essayReference) {
      return NextResponse.json({ error: "Invalid question for essay grading" }, { status: 400 });
    }

    const keys = await getGeminiApiKeys(session.user.personalGeminiKey);
    if (keys.length === 0) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const prompt = `
      As a medical professor, grade the following student's response to a clinical question.
      
      QUESTION STEM:
      ${question.body}
      
      MODEL ANSWER (RUBRIC):
      ${question.essayReference}
      
      STUDENT ANSWER:
      ${answer}
      
      Please evaluate based on accuracy, completeness, and clinical reasoning.
      Provide a JSON response ONLY with this schema:
      {
        "scorePercent": number (0-100),
        "feedback": "string (brief summary)",
        "strengths": ["string", "string"],
        "weaknesses": ["string", "string"],
        "missingKeyPoints": ["string", "string"]
      }
    `;

    const result = await callGeminiWithRetry(async (key) => {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      return await model.generateContent(prompt);
    }, session.user.personalGeminiKey);
    const text = result.response.text();
    
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    const grading = JSON.parse(jsonStr);

    return NextResponse.json(grading);
  } catch (error) {
    console.error("[grade-essay-api] error:", error);
    return NextResponse.json({ error: "AI grading failed" }, { status: 500 });
  }
}
