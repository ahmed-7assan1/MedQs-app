import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return;
  const originalId = user.id;
  try {
    await prisma.user.update({
      where: { id: originalId },
      data: { id: "test-update-id-" + Date.now() }
    });
    console.log("Success updating ID");
    // revert
    const u2 = await prisma.user.findFirst({ where: { email: user.email }});
    await prisma.user.update({ where: { id: u2!.id }, data: { id: originalId } });
  } catch (e) {
    console.error("Error:", e);
  }
}
main().finally(() => prisma.$disconnect());
