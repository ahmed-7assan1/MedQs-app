import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const FIELD_MAP: Record<string, string> = {
  gemini: "personalGeminiKey",
  groq: "personalGroqKey",
  siliconflow: "personalSiliconFlowKey",
  cloudflare: "personalCloudflareKey",
  huggingface: "personalHuggingfaceKey",
  together: "personalTogetherKey",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: Object.values(FIELD_MAP).reduce((acc, f) => ({ ...acc, [f]: true }), {}),
  });

  if (!user) {
    return NextResponse.json({ keys: {} });
  }

  const keys: Record<string, string> = {};
  for (const [provider, field] of Object.entries(FIELD_MAP)) {
    const val = (user as any)[field];
    if (val) keys[provider] = val;
  }

  return NextResponse.json({ keys });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const incoming: Record<string, string> = body.keys || {};

  const data: Record<string, string | null> = {};
  for (const [provider, field] of Object.entries(FIELD_MAP)) {
    data[field] = incoming[provider] || null;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
