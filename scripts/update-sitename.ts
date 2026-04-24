import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.siteConfig.updateMany({
    where: { id: "default" },
    data: { siteName: "MedOneX" },
  });
  console.log(`✅ Updated ${result.count} site config record(s) to MedOneX`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
