const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const uni = await prisma.university.findFirst();
  const fac = await prisma.faculty.findFirst({ where: { universityId: uni.id } });
  const year = await prisma.academicYear.findFirst({ where: { facultyId: fac.id } });
  const sem = await prisma.semester.findFirst({ where: { academicYearId: year.id } });

  const email = 'demo@medonex.com';
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      name: 'Demo Student',
      password: hashedPassword,
      universityId: uni.id,
      facultyId: fac.id,
      semesterId: sem.id,
    }
  });
  console.log('User created:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
