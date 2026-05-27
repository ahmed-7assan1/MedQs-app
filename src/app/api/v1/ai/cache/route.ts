import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function POST(req: NextRequest) {
  try {
    const { action, questionHash, persona, model, question, response } = await req.json();

    if (action === "lookup") {
      if (!questionHash || !persona || !model) {
        return NextResponse.json({ hit: false, error: "Missing fields" }, { status: 400 });
      }

      const cached = await prisma.aiResponseCache.findUnique({
        where: { questionHash },
      });

      if (cached && cached.persona === persona && cached.model === model) {
        const age = Date.now() - cached.updatedAt.getTime();
        if (age < CACHE_TTL_MS) {
          // Increment hit
          await prisma.aiResponseCache.update({
            where: { id: cached.id },
            data: { hitCount: { increment: 1 }, updatedAt: new Date() },
          });
          return NextResponse.json({ hit: true, response: cached.response });
        }
      }

      return NextResponse.json({ hit: false });
    }

    if (action === "store") {
      if (!questionHash || !persona || !model || !response) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      const existing = await prisma.aiResponseCache.findUnique({
        where: { questionHash },
      });

      if (existing) {
        // Update if response differs significantly
        const diff = levenshtein(existing.response, response);
        const similarity = 1 - diff / Math.max(existing.response.length, response.length);
        if (similarity < 0.85) {
          await prisma.aiResponseCache.update({
            where: { id: existing.id },
            data: { response, hitCount: { increment: 1 }, updatedAt: new Date() },
          });
        } else {
          // Same enough — just bump hit
          await prisma.aiResponseCache.update({
            where: { id: existing.id },
            data: { hitCount: { increment: 1 }, updatedAt: new Date() },
          });
        }
      } else {
        await prisma.aiResponseCache.create({
          data: {
            questionHash,
            normalizedQuestion: question || "",
            persona,
            model,
            response,
          },
        });
      }

      return NextResponse.json({ stored: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("AiResponseCache error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Simple Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[m][n];
}
