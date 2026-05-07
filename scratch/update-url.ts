import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const newUrl = process.argv[2];
if (!newUrl) {
  console.error("❌ Please provide a URL. Example: npx tsx scratch/update-url.ts https://my-url.loca.lt");
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Update NEXTAUTH_URL in .env
const updatedEnv = envContent.replace(/NEXTAUTH_URL="[^"]*"/, `NEXTAUTH_URL="${newUrl.replace(/\/$/, '')}"`);
fs.writeFileSync(envPath, updatedEnv);
console.log(`✅ .env updated with NEXTAUTH_URL="${newUrl}"`);

// Reload env
dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in .env");
  process.exit(1);
}

const bot = new Telegraf(token);

async function setWebhook() {
  const webhookUrl = `${newUrl.replace(/\/$/, '')}/api/telegram`;
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`🚀 Telegram Webhook successfully set to: ${webhookUrl}`);
    console.log("✨ Bot is now ACTIVE! Try /start in Telegram.");
  } catch (err: any) {
    console.error("❌ Failed to set webhook:", err.message);
  }
}

setWebhook();
