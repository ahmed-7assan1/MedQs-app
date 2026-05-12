import { PrismaClient } from '@prisma/client';

async function main() {
  const neonUrl = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&connection_limit=30";
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: neonUrl,
      },
    },
  });

  try {
    console.log('Counting rows in Neon...');
    const users = await prisma.user.count();
    const lectures = await prisma.lecture.count();
    const questions = await prisma.question.count();
    const posts = await prisma.post.count();
    
    console.log({
      users,
      lectures,
      questions,
      posts
    });
  } catch (error) {
    console.error('Failed to count rows:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
