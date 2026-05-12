import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&connection_limit=1";
const SUPABASE_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&connection_limit=1";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function syncData() {
  console.log("🔄 Starting Data Sync (Neon -> Supabase) with delays...");
  
  const oldDb = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
  const newDb = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });

  try {
    // Helper to sync table with progress
    const syncTable = async (name: string, model: any) => {
      const data = await (oldDb as any)[name].findMany();
      console.log(`📍 Syncing ${data.length} records for ${name}...`);
      for (const item of data) {
        await (newDb as any)[name].upsert({
          where: { id: item.id },
          update: item,
          create: item
        });
        await delay(50); // Small delay to avoid slamming the pooler
      }
    };

    // await syncTable('university', oldDb.university);
    // await syncTable('faculty', oldDb.faculty);
    // await syncTable('semester', oldDb.semester);
    // await syncTable('subject', oldDb.subject);
    // await syncTable('module', oldDb.module);
    // await syncTable('lecture', oldDb.lecture);
    // await syncTable('lectureFile', (oldDb as any).lectureFile);
    // await syncTable('lectureVideo', (oldDb as any).lectureVideo);
    // await syncTable('lectureRecord', (oldDb as any).lectureRecord);
    await syncTable('pastPaper', oldDb.pastPaper);
    await syncTable('question', oldDb.question);

    console.log("✅ Data sync completed successfully!");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

syncData();
