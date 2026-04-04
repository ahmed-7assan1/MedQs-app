import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestQuestionDetails } from "@/lib/gemini";
import { redisIncrWithExpire } from "@/lib/redis";

const RATE_LIMIT = 20; // requests per hour per admin user

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Rate limit: 20 AI suggest requests per hour per admin
  const key = `ratelimit:ai:suggest:${session!.user!.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT} AI suggestions per hour.` },
      { status: 429 }
    );
  }

  const { body } = await req.json();
  if (!body?.trim())
    return NextResponse.json({ error: "Question body required" }, { status: 400 });

  try {
    const suggestion = await suggestQuestionDetails(body);
    return NextResponse.json(suggestion);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI suggestion failed";
    console.error("[api/v1/ai/suggest]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
