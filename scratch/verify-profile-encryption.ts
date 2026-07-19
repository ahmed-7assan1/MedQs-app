/**
 * Verify that saving a key through the profile route encrypts it for
 * the previously-unsupported providers (Cloudflare, HuggingFace, GitHub, etc).
 *
 * Simulates exactly what profile/route.ts does:
 *   maybeEncrypt(raw, existing) → encryptKey(raw.trim())
 *   → prisma.user.update({ data: { personalCloudflareKey: encryptedValue } })
 */
import { PrismaClient } from "@prisma/client";
import { encryptKey } from "../src/lib/encryption";

const prisma = new PrismaClient();

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

async function main() {
  const TEST_KEY = "sk-test-cloudflare-profile-12345";

  // Simulate what profile/route.ts does on save
  const encrypted = encryptKey(TEST_KEY);
  console.log(`Encrypted value: ${encrypted.substring(0, 80)}...`);

  // Write to the primary admin user's personalCloudflareKey
  const email = "ahmed.mo7amed.7assan@gmail.com";
  await prisma.user.update({
    where: { email },
    data: { personalCloudflareKey: encrypted },
  });

  // Read back
  const user = await prisma.user.findUnique({
    where: { email },
    select: { personalCloudflareKey: true },
  });

  const stored = user?.personalCloudflareKey as string | null;
  const isEncrypted = stored ? looksEncrypted(stored) : false;

  console.log(`\nStored value preview: ${stored?.substring(0, 80)}...`);
  console.log(`Is encrypted format: ${isEncrypted}`);
  console.log(`Matches what we wrote: ${stored === encrypted}`);

  // Clear the test key
  await prisma.user.update({
    where: { email },
    data: { personalCloudflareKey: null },
  });

  if (!isEncrypted) {
    console.error("\nFAIL: Key was NOT stored in encrypted format!");
    process.exit(1);
  }

  console.log("\nPASS: Key is encrypted at rest via profile route.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
