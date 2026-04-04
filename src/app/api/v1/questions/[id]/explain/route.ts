// src/app/api/v1/questions/[id]/explain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExplanation } from "@/lib/gemini";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `explain:${params.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json({ explanation: cached, cached: true });

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { body: true, choices: true, answer: true, explanation: true, aiExplanation: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin explanation takes priority
  if (question.explanation) {
    await cacheSet(cacheKey, question.explanation, 3600);
    return NextResponse.json({ explanation: question.explanation, source: "admin" });
  }

  // Cached AI explanation
  if (question.aiExplanation) {
    await cacheSet(cacheKey, question.aiExplanation, 3600);
    return NextResponse.json({ explanation: question.aiExplanation, source: "ai_cached" });
  }

  // Generate fresh
  const explanation = await generateExplanation(
    question.body,
    question.choices as any,
    question.answer
  );

  // Persist AI explanation
  await prisma.question.update({ where: { id: params.id }, data: { aiExplanation: explanation } });
  await cacheSet(cacheKey, explanation, 3600);

  return NextResponse.json({ explanation, source: "ai_generated" });
}
