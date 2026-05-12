import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&connection_limit=1";
const SUPABASE_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&connection_limit=1&pgbouncer=true";

async function check() {
  const oldDb = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
  const newDb = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });

  try {
    console.log("=== SUPABASE (NEW) ===");
    const newLectures = await newDb.lecture.count();
    const newFiles = await (newDb as any).lectureFile.count();
    const newVideos = await (newDb as any).lectureVideo.count();
    const newRecords = await (newDb as any).lectureRecord.count();
    console.log("Lectures:", newLectures);
    console.log("LectureFiles:", newFiles);
    console.log("LectureVideos:", newVideos);
    console.log("LectureRecords:", newRecords);

    console.log("\n=== NEON (OLD) ===");
    const oldLectures = await oldDb.lecture.count();
    const oldFiles = await (oldDb as any).lectureFile.count();
    const oldVideos = await (oldDb as any).lectureVideo.count();
    const oldRecords = await (oldDb as any).lectureRecord.count();
    console.log("Lectures:", oldLectures);
    console.log("LectureFiles:", oldFiles);
    console.log("LectureVideos:", oldVideos);
    console.log("LectureRecords:", oldRecords);

    // Sample lecture with video from old DB
    const sampleWithVideo = await oldDb.lecture.findFirst({
      where: { videoUrl: { not: null } },
      select: { id: true, title: true, videoUrl: true }
    });
    console.log("\nSample lecture with video (OLD):", JSON.stringify(sampleWithVideo, null, 2));

  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

check().catch(console.error);
