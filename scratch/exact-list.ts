import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROVIDER_LABELS: Record<string, string> = {
  personalGeminiKey: "Google Gemini",
  personalOpenAIKey: "OpenAI",
  personalGroqKey: "Groq",
  personalOpenRouterKey: "OpenRouter",
  personalXAIKey: "xAI (Grok)",
  personalAnthropicKey: "Anthropic (Claude)",
  personalSiliconFlowKey: "SiliconFlow",
  personalCloudflareKey: "Cloudflare",
  personalHuggingfaceKey: "HuggingFace",
  personalTogetherKey: "Together AI",
  personalGithubKey: "GitHub Models",
  personalCerebrasKey: "Cerebras",
  personalMistralKey: "Mistral AI",
};

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

async function main() {
  const keyFields = Object.keys(PROVIDER_LABELS);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      ...Object.fromEntries(keyFields.map((f) => [f, true])),
    },
  });

  let count = 0;
  for (const user of users) {
    for (const field of keyFields) {
      const val = (user as any)[field];
      if (val && !looksEncrypted(val)) {
        count++;
        const who = user.email === "ahmed.mo7amed.7assan@gmail.com" ? "YOU (admin)" : `user ${user.email}`;
        console.log(`${count}. ${PROVIDER_LABELS[field]} (${field}) — ${who}`);
      }
    }
  }

  console.log(`\nTotal: ${count} keys in plaintext`);
  await prisma.$disconnect();
}

main().catch(console.error);
