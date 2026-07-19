import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

async function main() {
  const keyFields = [
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
  ];

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      ...Object.fromEntries(keyFields.map((f) => [f, true])),
    },
  });

  let plaintextFound = false;
  let encryptedFound = false;
  for (const user of users) {
    for (const field of keyFields) {
      const val = (user as any)[field];
      if (val) {
        if (looksEncrypted(val)) {
          encryptedFound = true;
        } else {
          plaintextFound = true;
          console.log(`PLAINTEXT: user ${user.id.slice(0,8)} (${user.email}) field ${field}`);
          console.log(`  preview: ${val.slice(0, 20)}...`);
        }
      }
    }
  }

  console.log(`\nEncrypted keys found: ${encryptedFound}`);
  console.log(`Plaintext keys found: ${plaintextFound}`);

  const totalWithKeys = users.filter((u) =>
    keyFields.some((f) => (u as any)[f] != null)
  ).length;
  console.log(`Users with any key: ${totalWithKeys}/${users.length}`);

  // Also check what keys look like for the first user who has both
  const sampleUser = users.find(u => keyFields.some(f => (u as any)[f]));
  if (sampleUser) {
    console.log(`\nSample user ${sampleUser.id.slice(0,8)} (${sampleUser.email}) key dump:`);
    for (const f of keyFields) {
      const v = (sampleUser as any)[f];
      if (v) {
        const enc = looksEncrypted(v);
        console.log(`  ${f}: ${enc ? `[ENCRYPTED: ${v.slice(0, 30)}...]` : `[PLAINTEXT: ${v.slice(0, 30)}...]`}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
