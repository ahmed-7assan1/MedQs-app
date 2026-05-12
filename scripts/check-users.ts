import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log(`Found ${users.length} users.`);
  console.log(users.slice(0, 5));
}
check();
