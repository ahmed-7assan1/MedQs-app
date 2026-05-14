import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseHealth() {
  console.log("--- Starting Database Health Check ---");
  try {
    // 1. Check connection
    await prisma.$connect();
    console.log("✅ Database Connection: SUCCESS");

    // 2. Check User count
    const userCount = await prisma.user.count();
    console.log(`📊 Total Users in Prisma: ${userCount}`);

    // 3. Check for users with missing academic info
    const incompleteUsers = await prisma.user.count({
      where: {
        OR: [
          { universityId: null },
          { facultyId: null },
          { semesterId: null }
        ]
      }
    });
    console.log(`⚠️ Users with incomplete academic info: ${incompleteUsers}`);

    // 4. Check for orphaned records (e.g. results without users)
    // const orphanedResults = await prisma.quizResult.count({
    //   where: { user: { is: null } }
    // });
    // console.log(`❗ Orphaned Quiz Results: ${orphanedResults}`);

    console.log("--- Health Check Complete ---");
  } catch (error) {
    console.error("❌ Database Health Check FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();
