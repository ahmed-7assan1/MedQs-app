import { PrismaClient } from "@prisma/client";

const OLD_DB_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=60";
const NEW_DB_URL = process.env.DATABASE_URL!;

const oldPrisma = new PrismaClient({ datasources: { db: { url: OLD_DB_URL } } });
const newPrisma = new PrismaClient({ datasources: { db: { url: NEW_DB_URL } } });

async function migrateTable(modelName: string) {
  const model = (oldPrisma as any)[modelName];
  const targetModel = (newPrisma as any)[modelName];

  if (!model || !targetModel) {
    console.warn(`⚠️ Model ${modelName} not found in one of the clients.`);
    return;
  }

  console.log(`📦 Migrating ${modelName}...`);
  const data = await model.findMany();
  console.log(`   Found ${data.length} records in OLD DB.`);

  if (data.length === 0) return;

  // Split data into chunks of 100 to avoid large payload errors
  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await targetModel.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  console.log(`   ✅ Finished ${modelName}.`);
}

async function main() {
  console.log("🚀 Starting Data Migration...");

  // Disable constraints in the new DB for the migration session
  await newPrisma.$executeRawUnsafe("SET session_replication_role = 'replica';");

  const models = [
    "siteConfig",
    "university",
    "faculty",
    "academicYear",
    "semester",
    "module",
    "subject",
    "lecture",
    "user",
    "rank",
    "forum",
    "post",
    "comment",
    "question",
    "pastPaper",
    "flashcard",
    "lectureFile",
    "lectureVideo",
    "lectureRecord",
    "quizAttempt",
    "quizAttemptItem",
    "studyAssistantProfile",
    "notification",
    "note",
    "medicalTeam",
    "teamMember",
    "studyRoom",
    "studyRoomMember",
    "studyRoomPost",
    "poll",
    "pollOption",
    "pollVote",
    "hashtag",
    "postHashtag",
  ];

  for (const model of models) {
    try {
      await migrateTable(model);
    } catch (err) {
      console.error(`❌ Error migrating ${model}:`, err);
    }
  }

  // Re-enable constraints
  await newPrisma.$executeRawUnsafe("SET session_replication_role = 'origin';");

  console.log("✨ Migration Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  });
