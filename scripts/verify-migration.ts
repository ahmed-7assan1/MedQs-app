import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&connection_limit=30";
const SUPABASE_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=60";

async function verify() {
  const source = new PrismaClient({ datasources: { db: { url: NEON_URL } } });
  const target = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });

  try {
    console.log('🔍 Verifying Data Migration...');

    const tables = [
      'siteConfig', 'university', 'faculty', 'academicYear', 'semester',
      'module', 'subject', 'rank', 'user', 'forum', 'poll', 'pollOption',
      'studyRoom', 'hashtag', 'lecture', 'question', 'post', 'postHashtag',
      'comment', 'pollVote', 'studyRoomMember', 'studyRoomPost', 'studyRoomComment',
      'savedQuestion', 'quizAttempt', 'quizAttemptItem'
    ];

    let allMatch = true;

    for (const table of tables) {
      // @ts-ignore
      const sourceCount = await source[table].count();
      // @ts-ignore
      const targetCount = await target[table].count();
      
      if (sourceCount === targetCount) {
        console.log(`✅ ${table.padEnd(20)}: ${sourceCount} === ${targetCount}`);
      } else {
        console.log(`❌ ${table.padEnd(20)}: Neon(${sourceCount}) !== Supabase(${targetCount})`);
        allMatch = false;
      }
    }

    if (allMatch) {
      console.log('🎉 All verified tables match perfectly!');
    } else {
      console.log('⚠️ Some tables have mismatched counts.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

verify();
