import { Telegraf } from "telegraf";
import { initDb } from "./helpers";
import { registerStart } from "./start";
import { registerAuth } from "./auth";
import { registerAI } from "./ai";
import { registerContact } from "./contact";
import { registerGroup } from "./group";
import { registerModules } from "./modules";

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TELEGRAM_STORAGE_GROUP_ID?: string;
  SUPPORT_TELEGRAM_CHAT_ID?: string;
  [key: string]: string | undefined;
};

let botInstance: Telegraf | null = null;

export function createBot(env: Bindings): Telegraf {
  if (botInstance) return botInstance;

  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  bot.catch((err, ctx) => {
    console.error(`[Bot] Error for ${ctx.updateType}:`, err);
  });

  registerStart(bot, env);
  registerAuth(bot, env);
  registerAI(bot, env);
  registerContact(bot, env);
  registerGroup(bot, env);
  registerModules(bot, env);

  botInstance = bot;
  console.log("[Bot] All handlers registered");
  return bot;
}

export function resetBot(): void {
  botInstance = null;
}
