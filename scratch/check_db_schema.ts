import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'LectureVideoComment'`;
    console.log("LectureVideoComment Columns:", JSON.stringify(result, null, 2));
    
    const count = await prisma.lectureVideoComment.count();
    console.log("Total Count:", count);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
