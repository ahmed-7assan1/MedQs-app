import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/encryption";
import { getAllProviderIds, getKeyField } from "@/lib/providers";

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      useCustomKey: true,
      personalGeminiKey: true,
      personalOpenAIKey: true,
      personalGroqKey: true,
      personalOpenRouterKey: true,
      personalXAIKey: true,
      personalAnthropicKey: true,
      personalSiliconFlowKey: true,
      personalCloudflareKey: true,
      personalHuggingfaceKey: true,
      personalTogetherKey: true,
      personalGithubKey: true,
      personalCerebrasKey: true,
      personalMistralKey: true,
    },
  });

  if (!user || !user.useCustomKey) {
    return NextResponse.json({ keys: null });
  }

  const keys: Record<string, string> = {};
  const providerIds = getAllProviderIds();

  for (const provider of providerIds) {
    const field = getKeyField(provider) as keyof typeof user;
    const raw = user[field] as string | null | undefined;
    if (!raw) continue;

    if (looksEncrypted(raw)) {
      try {
        keys[provider] = decryptKey(raw);
      } catch {
        // skip corrupted keys
      }
    } else {
      keys[provider] = raw;
    }
  }

  return NextResponse.json({ keys });
}
