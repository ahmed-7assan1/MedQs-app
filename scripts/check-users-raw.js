const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.egxvmkhynsaikucsucjs:Ahmed%26hassan3112006@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  console.log("Connected to database.");
  
  const res = await client.query('SELECT COUNT(*) as count FROM "User"');
  console.log(`Total Users: ${res.rows[0].count}`);
  
  const resUniCount = await client.query('SELECT COUNT(*) as count FROM "University"');
  console.log(`Total Universities: ${resUniCount.rows[0].count}`);

  const resFacultyCount = await client.query('SELECT COUNT(*) as count FROM "Faculty"');
  console.log(`Total Faculties: ${resFacultyCount.rows[0].count}`);

  const resYearCount = await client.query('SELECT COUNT(*) as count FROM "AcademicYear"');
  console.log(`Total Academic Years: ${resYearCount.rows[0].count}`);

  const resSemCount = await client.query('SELECT COUNT(*) as count FROM "Semester"');
  console.log(`Total Semesters: ${resSemCount.rows[0].count}`);

  const sampleUni = await client.query('SELECT name FROM "University" LIMIT 1');
  console.log(`Sample University: ${sampleUni.rows[0]?.name}`);

  await client.end();
}

run().catch(console.error);
