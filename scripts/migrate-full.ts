import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&connection_limit=30";
const SUPABASE_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=60";

async function migrate() {
  const source = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
  const target = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });

  try {
    console.log('🚀 Starting Data Migration (Comprehensive Order)...');

    const tables = [
      'siteConfig',
      'university',
      'faculty',
      'academicYear',
      'semester',
      'module',
      'subject',
      'rank',
      'user',
      'forum',
      'poll', // Before Post
      'pollOption', // Before Post
      'studyRoom', // Before Post
      'hashtag', // Before Post
      'lecture',
      'question',
      'post',
      'postHashtag',
      'comment',
      'pollVote',
      'studyRoomMember',
      'studyRoomPost',
      'studyRoomComment',
      'savedQuestion',
      'quizAttempt',
      'quizAttemptItem'
    ];

    for (const table of tables) {
      console.log(`📦 Migrating table: ${table}...`);
      // @ts-ignore
      const data = await source[table].findMany();
      if (data.length > 0) {
        console.log(`  Found ${data.length} records. Inserting...`);
        // @ts-ignore
        await target[table].createMany({
          data: data,
          skipDuplicates: true,
        });
        console.log(`  ✅ Done with ${table}`);
      } else {
        console.log(`  Empty table. Skipping.`);
      }
    }

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

migrate();
