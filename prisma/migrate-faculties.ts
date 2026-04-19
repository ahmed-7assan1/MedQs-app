import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Faculty Categorization Migration ---');
  const faculties = await prisma.faculty.findMany();
  
  for (const f of faculties) {
    let cat = 'OTHER';
    const n = f.name.toLowerCase();
    
    if (n.includes('medicine') || n.includes('بشري')) {
      cat = 'HUMAN_MEDICINE';
    } else if (n.includes('dental') || n.includes('dentistry') || n.includes('أسنان')) {
      cat = 'DENTAL_MEDICINE';
    } else if (n.includes('pharmacy') || n.includes('صيدلة')) {
      cat = 'PHARMACY';
    } else if (n.includes('physical therapy') || n.includes('علاج طبيعي')) {
      cat = 'PHYSICAL_THERAPY';
    }

    if (cat !== (f as any).category) {
      await (prisma.faculty as any).update({
        where: { id: f.id },
        data: { category: cat as any }
      });
      console.log(`[UPDATED] ${f.name} -> ${cat}`);
    } else {
      console.log(`[SKIPPED] ${f.name} is already ${cat}`);
    }
  }

  console.log('--- Migration Complete ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
