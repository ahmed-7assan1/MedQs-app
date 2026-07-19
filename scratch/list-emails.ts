import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log(`Users: ${users.length}`);
  for (const u of users) console.log(u.email);
  await prisma.$disconnect();
}
main();
