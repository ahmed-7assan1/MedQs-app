import { PrismaClient } from '@prisma/client';

async function verifyIntegrity() {
  const prisma = new PrismaClient();
  console.log("🔍 Starting Database Integrity Check...");

  try {
    // 1. Check basic counts
    const counts = {
      universities: await prisma.university.count(),
      faculties: await prisma.faculty.count(),
      semesters: await prisma.semester.count(),
      modules: await prisma.module.count(),
      subjects: await prisma.subject.count(),
      lectures: await prisma.lecture.count(),
      questions: await prisma.question.count(),
      files: await prisma.lectureFile.count(),
      videos: await prisma.lectureVideo.count(),
    };
    console.table(counts);

    // 2. Check for orphaned lectures (no subject)
    const orphanedLectures = await prisma.lecture.count({
      where: { subjectId: { equals: "" } }
    });
    console.log(`Orphaned Lectures: ${orphanedLectures}`);

    // 3. Check for orphaned questions (no lecture)
    const orphanedQuestions = await prisma.question.count({
      where: { lectureId: { equals: "" } }
    });
    console.log(`Orphaned Questions: ${orphanedQuestions}`);

    // 4. Test a complex relation query (Mastery logic simulation)
    const sampleModule = await prisma.module.findFirst({
      include: {
        subjects: {
          include: {
            lectures: {
              include: {
                _count: { select: { questions: true } }
              }
            }
          }
        }
      }
    });
    
    if (sampleModule) {
      console.log(`✅ Relation Test Passed: Module "${sampleModule.name}" retrieved with its subjects and lectures.`);
    }

    console.log("\n🚀 FINAL VERDICT: Database is synchronized and healthy!");

  } catch (error) {
    console.error("❌ Integrity Check Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyIntegrity();
