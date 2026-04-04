import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAIReplyWithFallback } from "@/lib/ai-router";

// Daily chat limits per rank (label → daily limit; -1 = unlimited)
const RANK_LIMITS: Record<string, number> = {
  Newbie:       5,
  Active:       15,
  Contributor:  30,
  Expert:       60,
  Elite:        -1, // unlimited
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, context } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Get user with rank
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rank: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rankLabel = user.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 5;

  // Check daily usage
  const today = new Date().toISOString().slice(0, 10);

  if (dailyLimit !== -1) {
    const usageRecord = await prisma.aIUsageLog.findUnique({
      where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
    });
    const used = usageRecord?.count ?? 0;

    if (used >= dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily limit reached`,
          limit: dailyLimit,
          used,
          rankLabel,
          nextRankHint: rankLabel !== "Elite"
            ? `Earn more points to reach a higher rank and get more daily messages!`
            : null,
        },
        { status: 429 }
      );
    }
  }

  const systemPrompt = `You are MedQs AI, a helpful medical education assistant for medical students.
You help students understand medical concepts, explain topics, answer questions about their curriculum, and provide study tips.
Be concise, accurate, and friendly. Use simple language appropriate for medical students.
If asked about a specific medical topic, give a clear educational explanation.
Do not provide personal medical advice or diagnoses — always remind students to consult their professors or clinical supervisors for patient care decisions.
${context ? `\nCurrent context: The student is studying ${context}` : ""}`;

  const aiResult = await generateAIReplyWithFallback(message, systemPrompt);
  const reply = aiResult.text;

  // Increment usage counter
  await prisma.aIUsageLog.upsert({
    where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
    create: { userId: user.id, type: "chat", date: today, count: 1 },
    update: { count: { increment: 1 } },
  });

  // Get updated count
  const updatedUsage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
  });

  return NextResponse.json({
    reply,
    provider: aiResult.provider,
    used: updatedUsage?.count ?? 1,
    limit: dailyLimit,
    rankLabel,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rank: true },
  });

  const rankLabel = user?.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 5;
  const today = new Date().toISOString().slice(0, 10);

  const usage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId: session.user.id, type: "chat", date: today } },
  });

  return NextResponse.json({
    used: usage?.count ?? 0,
    limit: dailyLimit,
    rankLabel,
    limits: RANK_LIMITS,
  });
}
