import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.question.count();
  console.log(`Total Questions: ${count}`);
  
  const sample = await prisma.question.findFirst({
    select: { lectureId: true, body: true }
  });
  console.log("Sample Question:", sample);
  
  const lecturesWithQuestions = await prisma.lecture.findMany({
    where: { questions: { some: {} } },
    select: { id: true, title: true, _count: { select: { questions: true } } }
  });
  console.log("Lectures with questions:", lecturesWithQuestions);
}

main().finally(() => prisma.$disconnect());
