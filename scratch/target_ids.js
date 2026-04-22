const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const university = await prisma.university.findFirst({
    where: { name: { contains: 'Mansoura National', mode: 'insensitive' } }
  });

  if (!university) {
    console.log("University not found");
    return;
  }

  const semester = await prisma.semester.findFirst({
    where: {
      name: { contains: 'Sem 4', mode: 'insensitive' },
      academicYear: {
        yearNumber: 2,
        universityId: university.id
      }
    },
    include: {
      academicYear: true
    }
  });

  console.log(JSON.stringify({ university, semester }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
