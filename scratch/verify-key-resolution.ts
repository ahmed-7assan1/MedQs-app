import { PrismaClient } from "@prisma/client";
import { PROVIDERS, getKeyField } from "../src/lib/providers";
import { decryptKey } from "../src/lib/encryption";

const prisma = new PrismaClient();

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

function resolveBestKeyTest(user: any, provider: string): { key: string; source: string } | null {
  const keyField = getKeyField(provider);
  console.log(`  getKeyField("${provider}") = "${keyField}"`);

  const rawKey = user[keyField] as string | undefined | null;
  console.log(`  user["${keyField}"] = ${rawKey ? (looksEncrypted(rawKey) ? "[ENCRYPTED]" : "[PLAINTEXT]") : "undefined/null"}`);

  if (rawKey) {
    if (looksEncrypted(rawKey)) {
      try {
        const decrypted = decryptKey(rawKey);
        return { key: decrypted, source: "user" };
      } catch {
        return null;
      }
    }
    return { key: rawKey, source: "user" };
  }

  if (user.adminAiKeys) {
    const adminKeyField = `encrypted${provider.charAt(0).toUpperCase() + provider.slice(1)}Key`;
    const adminRaw = user.adminAiKeys[adminKeyField] as string | undefined | null;
    console.log(`  adminAiKeys["${adminKeyField}"] = ${adminRaw ? "[PRESENT]" : "undefined"}`);
    if (adminRaw) {
      try {
        const decrypted = decryptKey(adminRaw);
        return { key: decrypted, source: "admin" };
      } catch {
        return null;
      }
    }
  }

  return null;
}

async function main() {
  const providersToTest = ["openrouter", "xai", "gemini", "openai"];
  
  const user = await prisma.user.findUnique({
    where: { email: "ahmed.mo7amed.7assan@gmail.com" },
    include: { adminAiKeys: true },
  }) as any;

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log(`Test user: ${user.email} (${user.id.slice(0,8)})\n`);

  for (const provider of providersToTest) {
    console.log(`Testing ${provider}:`);
    const result = resolveBestKeyTest(user, provider);
    if (result) {
      console.log(`  ✅ RESOLVED: source=${result.source}, key=${result.key.slice(0, 15)}...`);
    } else {
      console.log(`  ❌ NULL (no key found)`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

main().catch(console.error);
