import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&connection_limit=1";
const SUPABASE_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&connection_limit=1&pgbouncer=true";

async function check() {
  const oldDb = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
  const newDb = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });

  try {
    const [oldP, oldQ] = await Promise.all([
      oldDb.pastPaper.count(),
      oldDb.question.count(),
    ]);
    const [newP, newQ] = await Promise.all([
      newDb.pastPaper.count(),
      newDb.question.count(),
    ]);

    console.log('OLD (Neon): PastPapers:', oldP, 'Questions:', oldQ);
    console.log('NEW (Supabase): PastPapers:', newP, 'Questions:', newQ);
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

check().catch(console.error);
