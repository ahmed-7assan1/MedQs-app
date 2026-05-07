import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.NEXTAUTH_URL;

if (!token || !url) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN or NEXTAUTH_URL in .env");
  process.exit(1);
}

const bot = new Telegraf(token);

async function fix() {
  console.log(`🤖 Attempting to fix bot at: ${url}`);
  try {
    // 1. Delete Webhook to clear pending updates
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log("✅ Old Webhook deleted.");

    // 2. Set new Webhook
    const webhookUrl = `${url.replace(/\/$/, '')}/api/telegram`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`🚀 Webhook set to: ${webhookUrl}`);

    // 3. Verify
    const info = await bot.telegram.getWebhookInfo();
    console.log("📊 Webhook Info:", JSON.stringify(info, null, 2));

    if (info.url === webhookUrl) {
      console.log("\n✨ Bot should be responding now! Try sending /start in Telegram.");
    } else {
      console.log("\n⚠️ Webhook URL mismatch. Check your NEXTAUTH_URL.");
    }
  } catch (err: any) {
    console.error("❌ Error fixing bot:", err.message);
  }
}

fix();
