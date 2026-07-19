// Test: send to first 5 users only
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = "http://localhost:3000/api/v1/auth/send-email";

async function main() {
  const users = await prisma.user.findMany({ select: { email: true }, take: 5 });
  const emails = users.map((u) => u.email);
  console.log("Sending to:", emails);

  for (const email of emails) {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "security_notice", email }),
      });
      const text = await res.text();
      console.log(`${email}: ${res.status} ${text}`);
    } catch (e: any) {
      console.error(`${email}: FETCH ERROR ${e.message}`);
    }
  }
  await prisma.$disconnect();
}

main();
