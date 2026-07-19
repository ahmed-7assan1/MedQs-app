/**
 * One-time migration: encrypt all existing plaintext user API keys.
 * Run AFTER deploying the fixed personal-ai-key route.
 * 
 * Usage: npx tsx scripts/encrypt-existing-keys.ts
 */
import { PrismaClient } from "@prisma/client";
import { encryptKey } from "../src/lib/encryption";

const prisma = new PrismaClient();

const KEY_FIELDS = [
  "personalGeminiKey",
  "personalOpenAIKey",
  "personalGroqKey",
  "personalOpenRouterKey",
  "personalXAIKey",
  "personalAnthropicKey",
  "personalSiliconFlowKey",
  "personalCloudflareKey",
  "personalHuggingfaceKey",
  "personalTogetherKey",
  "personalGithubKey",
  "personalCerebrasKey",
  "personalMistralKey",
] as const;

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

async function main() {
  const select = Object.fromEntries(KEY_FIELDS.map((f) => [f, true]));
  const users = await prisma.user.findMany({ select: { id: true, ...select } });

  let totalEncrypted = 0;
  let totalPlaintext = 0;

  for (const user of users) {
    const updates: Record<string, string> = {};
    for (const field of KEY_FIELDS) {
      const val = (user as any)[field] as string | null | undefined;
      if (val && !looksEncrypted(val)) {
        updates[field] = encryptKey(val);
        totalPlaintext++;
      } else if (val && looksEncrypted(val)) {
        totalEncrypted++;
      }
    }
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      console.log(`Encrypted ${Object.keys(updates).length} keys for user ${user.id.slice(0, 8)}`);
    }
  }

  console.log(`\nDone. Already encrypted: ${totalEncrypted}, newly encrypted: ${totalPlaintext}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
