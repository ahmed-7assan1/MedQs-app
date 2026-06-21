import { Telegraf } from "telegraf";
import { registerStart } from "./start";
import { registerAuth } from "./auth";
import { registerAI } from "./ai";
import { registerContact } from "./contact";
import { registerGroup } from "./group";
import { registerModules } from "./modules";

let bot: Telegraf | null = null;

export function getBot(): Telegraf {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
    }

    bot = new Telegraf(token);

    bot.catch((err, ctx) => {
      console.error(`[Telegram Bot] Error for ${ctx.updateType}:`, err);
    });

    registerStart(bot);
    registerAuth(bot);
    registerAI(bot);
    registerContact(bot);
    registerGroup(bot);
    registerModules(bot);

    console.log("[Telegram Bot] All handlers registered");
  }

  return bot;
}

export function resetBot(): void {
  bot = null;
}
