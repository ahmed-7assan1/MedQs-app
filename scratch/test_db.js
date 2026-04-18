const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Attempting to connect to:', process.env.DATABASE_URL.split('@')[1]);
    await client.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Current Time from DB:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed!');
    console.error(err);
    process.exit(1);
  }
}

testConnection();
