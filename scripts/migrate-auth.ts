import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function migrateAuth() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, password: true }
  });

  console.log(`Migrating ${users.length} users to Supabase Auth...`);

  for (const u of users) {
    if (!u.email) continue;
    
    // Check if user already exists in auth.users
    const { data: existingUser } = await supabase.auth.admin.getUserById(u.id);
    if (existingUser?.user) {
      console.log(`User ${u.email} already exists in auth.`);
      continue;
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        email_confirm: true,
        user_metadata: { name: u.name },
        // We can't import bcrypt easily via JS, so we'll assign a random strong password 
        // and users will need to "Reset Password" or use Google login.
        password: `Migrated@${Math.random().toString(36).slice(-8)}`
      });

      if (error) {
        console.error(`Error migrating ${u.email}:`, error.message);
      } else {
        console.log(`Successfully migrated: ${u.email}`);
      }
    } catch (e: any) {
      console.error(`Failed to create ${u.email}:`, e.message);
    }
  }

  console.log("Migration finished.");
}

migrateAuth();
