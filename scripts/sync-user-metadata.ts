import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncMetadata() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
      }
    }
  });
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      role: true, 
      facultyId: true, 
      semesterId: true, 
      universityId: true,
      name: true,
      faculty: { select: { category: true, name: true } },
      university: { select: { name: true } }
    }
  });

  console.log(`Syncing metadata for ${users.length} users...`);

  for (const u of users) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, {
      user_metadata: {
        name: u.name,
        role: u.role,
        facultyId: u.facultyId,
        semesterId: u.semesterId,
        universityId: u.universityId,
        facultyCategory: u.faculty?.category,
        facultyName: u.faculty?.name,
        universityName: u.university?.name
      }
    });

    if (error) {
      console.error(`Error syncing ${u.id}:`, error.message);
    } else {
      console.log(`Synced: ${u.id}`);
    }
  }

  console.log("Sync finished.");
}

syncMetadata();
