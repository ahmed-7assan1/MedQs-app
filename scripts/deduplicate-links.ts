import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database cleanup: Deduplicating links...");

  // 1. Deduplicate LectureVideo URLs
  console.log("--- Checking LectureVideo URLs ---");
  const lectureVideos = await prisma.lectureVideo.findMany({
    select: { id: true, url: true, createdAt: true },
  });

  const videoGroups: Record<string, typeof lectureVideos> = {};
  lectureVideos.forEach((v) => {
    if (!v.url) return;
    if (!videoGroups[v.url]) videoGroups[v.url] = [];
    videoGroups[v.url].push(v);
  });

  let videoDeletedCount = 0;
  for (const url in videoGroups) {
    const group = videoGroups[url];
    if (group.length > 1) {
      // Sort by createdAt (keep oldest)
      group.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const toDelete = group.slice(1);
      
      console.log(`Duplicate found: ${url} (${group.length} times). Deleting ${toDelete.length} copies.`);
      
      await prisma.lectureVideo.deleteMany({
        where: { id: { in: toDelete.map((d) => d.id) } },
      });
      videoDeletedCount += toDelete.length;
    }
  }
  console.log(`✅ Cleaned up ${videoDeletedCount} duplicate LectureVideos.`);

  // 2. Deduplicate Lecture videoUrls
  console.log("--- Checking Lecture videoUrls ---");
  const lectures = await prisma.lecture.findMany({
    where: { videoUrl: { not: null } },
    select: { id: true, videoUrl: true },
  });

  // Note: For Lectures, we can't just delete the lecture because it has questions/files attached.
  // We should just nullify the duplicate videoUrls or keep the first one.
  // Actually, the user said "حذف المكرره واترك نسخه واحده فقط". For lectures, this is risky.
  // But usually, duplicate links mean duplicate entries.
  
  const lectureGroups: Record<string, typeof lectures> = {};
  lectures.forEach((l) => {
    if (!l.videoUrl) return;
    if (!lectureGroups[l.videoUrl]) lectureGroups[l.videoUrl] = [];
    lectureGroups[l.videoUrl].push(l);
  });

  let lectureUpdatedCount = 0;
  for (const url in lectureGroups) {
    const group = lectureGroups[url];
    if (group.length > 1) {
      const toClean = group.slice(1);
      console.log(`Duplicate videoUrl in lectures: ${url} (${group.length} times). Nullifying ${toClean.length} copies.`);
      
      await prisma.lecture.updateMany({
        where: { id: { in: toClean.map((c) => c.id) } },
        data: { videoUrl: null },
      });
      lectureUpdatedCount += toClean.length;
    }
  }
  console.log(`✅ Cleaned up ${lectureUpdatedCount} duplicate videoUrls in Lectures.`);

  console.log("✨ Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
