const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const semesters = await prisma.semester.findMany({
    where: {
      academicYear: {
        university: {
          name: { contains: 'Mansoura', mode: 'insensitive' }
        }
      }
    },
    include: {
      academicYear: {
        include: {
          university: true,
          faculty: true
        }
      }
    }
  });

  console.log(JSON.stringify(semesters, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
