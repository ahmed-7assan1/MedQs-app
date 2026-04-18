const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const videos = await prisma.lectureVideo.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        url: true
      }
    });

    console.log("--- LECTURE VIDEOS ---");
    console.log(JSON.stringify(videos, null, 2));
    
    const channels = await prisma.allowedChannel.findMany({
      select: { name: true, youtubeId: true }
    });
    console.log("--- ALLOWED CHANNELS ---");
    console.log(JSON.stringify(channels, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
