import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to Supabase...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
