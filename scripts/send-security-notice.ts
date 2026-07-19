import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = "http://localhost:3000/api/v1/auth/send-email";

async function sendOne(email: string): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "security_notice", email }),
  });
  if (!res.ok) throw new Error(`${email}: ${await res.text()}`);
  return email;
}

async function main() {
  const users = await prisma.user.findMany({ select: { email: true } });
  const emails = users.map((u) => u.email).filter(Boolean) as string[];
  console.log(`Sending to ${emails.length} users...`);

  const BATCH = 5;
  let sent = 0;
  let failed: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(sendOne));
    for (const r of results) {
      if (r.status === "fulfilled") {
        sent++;
        process.stdout.write(".");
      } else {
        failed.push(r.reason.message || String(r.reason));
        process.stdout.write("x");
      }
    }
    // Small delay between batches
    if (i + BATCH < emails.length) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed.length}`);
  if (failed.length) console.log("Errors:", failed.slice(0, 3).join("; "));
  await prisma.$disconnect();
}

main();
