import { PrismaClient } from "@prisma/client";
import { getKeyField } from "../src/lib/providers";

const prisma = new PrismaClient();

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "ahmed.mo7amed.7assan@gmail.com" },
    include: { adminAiKeys: true },
  }) as any;

  if (!user) { console.log("User not found"); return; }

  const testProviders = ["gemini", "groq", "openrouter", "siliconflow", "cloudflare", "huggingface", "github", "cerebras"];

  for (const provider of testProviders) {
    const keyField = getKeyField(provider);
    if (!keyField) { console.log(`${provider}: NO KEY FIELD`); continue; }

    const rawKey = user[keyField] as string | undefined;
    const isEncrypted = rawKey ? looksEncrypted(rawKey) : false;
    console.log(`${provider}: field=${keyField} present=${!!rawKey} encrypted=${isEncrypted}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
