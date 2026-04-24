/**
 * Seed Faculty of Medicine for all universities
 * Run: npx tsx scripts/seed-faculties.ts
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting Faculty of Medicine seed...\n");

  const universities = await prisma.university.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${universities.length} universities\n`);

  for (const uni of universities) {
    console.log(`📍 University: ${uni.name}`);

    // Check existing faculties
    const existing = await prisma.faculty.findMany({
      where: { universityId: uni.id },
      select: { id: true, name: true },
    });

    let facultyId;

    if (existing.length === 0) {
      // Create Faculty of Medicine
      const fac = await prisma.faculty.create({
        data: { name: "Faculty of Medicine", universityId: uni.id },
      });
      facultyId = fac.id;
      console.log(`   ✅ Created "Faculty of Medicine" (${fac.id})`);
    } else {
      const medFac = existing.find((f: { id: string; name: string }) =>
        f.name.toLowerCase().includes("medicine")
      ) ?? existing[0];
      facultyId = medFac.id;
      console.log(`   ℹ️  Using existing faculty: "${medFac.name}" (${medFac.id})`);
    }

    // Update all years without a faculty
    const result = await prisma.academicYear.updateMany({
      where: { universityId: uni.id, facultyId: null },
      data: { facultyId },
    });

    console.log(`   📚 Updated ${result.count} academic year(s) → Faculty of Medicine\n`);
  }

  console.log("✅ Done!");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
