import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    const comments = await prisma.lectureVideoComment.findMany({
      include: {
        user: true,
        video: true
      }
    });
    console.log("Total Comments in DB:", comments.length);
    console.log("Details:", JSON.stringify(comments.map(c => ({ 
      id: c.id, 
      content: c.content, 
      parentId: (c as any).parentId, // Using any because types might be tricky in scratch
      videoId: c.videoId,
      lectureId: c.video.lectureId
    })), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
