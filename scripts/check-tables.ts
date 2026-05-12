import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Checking for tables in Supabase...');
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables found:', result);
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
