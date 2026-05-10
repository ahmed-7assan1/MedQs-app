import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const apiKey = process.env.GEMINI_API_KEY || session.user.personalGeminiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from markdown if needed
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    const grading = JSON.parse(jsonStr);

    return NextResponse.json(grading);
  } catch (error) {
    console.error("[grade-essay-api] error:", error);
    return NextResponse.json({ error: "AI grading failed" }, { status: 500 });
  }
}
