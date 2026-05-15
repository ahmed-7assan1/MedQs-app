import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyStudentData() {
  console.log("🔍 Verifying Student Data Integrity...");

  try {
    const totalUsers = await prisma.user.count();
    
    // Check key academic columns
    const usersWithUni = await prisma.user.findMany({
      where: { universityId: { not: null } },
      select: { id: true, universityId: true, facultyId: true, semesterId: true, name: true, email: true },
      take: 100 // Sample 100 users for detailed check
    });

    const withUniCount = await prisma.user.count({ where: { universityId: { not: null } } });
    const withFacultyCount = await prisma.user.count({ where: { facultyId: { not: null } } });
    const withSemesterCount = await prisma.user.count({ where: { semesterId: { not: null } } });

    console.log(`\n📊 Data Stats:`);
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Users with University: ${withUniCount}`);
    console.log(`- Users with Faculty: ${withFacultyCount}`);
    console.log(`- Users with Semester: ${withSemesterCount}`);

    if (usersWithUni.length > 0) {
      console.log("\n✅ Success: Student data columns are present and populated.");
      
      // Verify relation integrity
      const firstUser = usersWithUni[0];
      console.log(`\n🧪 Testing Relation Integrity for: ${firstUser.name || firstUser.email}`);
      
      const detailedUser = await prisma.user.findUnique({
        where: { id: firstUser.id },
        include: {
          university: true,
          semester: {
            include: {
              academicYear: {
                include: {
                  faculty: true
                }
              }
            }
          }
        }
      });

      if (detailedUser) {
        console.log(`  University: ${detailedUser.university?.name || "❌ Missing Relation"}`);
        console.log(`  Faculty: ${detailedUser.semester?.academicYear?.faculty?.name || "❌ Missing Relation"}`);
        console.log(`  Semester: ${detailedUser.semester?.name || "❌ Missing Relation"}`);
      }
    } else {
      console.log("\n⚠️ No users found with universityId. Please check if data migration was actually performed.");
    }

  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStudentData();
