import { Client } from "pg";

const OLD_DIRECT_URL = "postgresql://postgres.uihpxyiuofkbpldxegvm:Ahmed%26hassan3112006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
const NEW_DIRECT_URL = "postgresql://postgres.egxvmkhynsaikucsucjs:Ahmed%26hassan3112006@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function main() {
  const oldClient = new Client({ 
    connectionString: OLD_DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });
  const newClient = new Client({ 
    connectionString: NEW_DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🚀 Starting Auth Users Migration...");
    await oldClient.connect();
    await newClient.connect();

    // 1. Fetch users from old auth.users
    console.log("📥 Fetching users from old auth.users...");
    const usersRes = await oldClient.query("SELECT * FROM auth.users");
    const users = usersRes.rows;
    console.log(`   Found ${users.length} users.`);

    // 2. Fetch identities from old auth.identities
    console.log("📥 Fetching identities from old auth.identities...");
    const identitiesRes = await oldClient.query("SELECT * FROM auth.identities");
    const identities = identitiesRes.rows;
    console.log(`   Found ${identities.length} identities.`);

    // 3. Disable triggers in new DB for auth schema
    console.log("🛠️ Disabling triggers in new auth schema...");
    await newClient.query("SET session_replication_role = 'replica';");

    // 4. Insert users into new auth.users
    console.log("📤 Inserting users into new auth.users...");
    for (const user of users) {
      const columns = Object.keys(user).join(", ");
      const values = Object.values(user);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      
      try {
        await newClient.query(
          `INSERT INTO auth.users (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        );
      } catch (err) {
        console.error(`   ❌ Failed to insert user ${user.email}:`, (err as any).message);
      }
    }

    // 5. Insert identities into new auth.identities
    console.log("📤 Inserting identities into new auth.identities...");
    for (const identity of identities) {
      const columns = Object.keys(identity).join(", ");
      const values = Object.values(identity);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      try {
        await newClient.query(
          `INSERT INTO auth.identities (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        );
      } catch (err) {
        console.error(`   ❌ Failed to insert identity ${identity.id}:`, (err as any).message);
      }
    }

    // 6. Re-enable triggers
    await newClient.query("SET session_replication_role = 'origin';");

    console.log("✨ Auth Migration Complete!");

  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main();
