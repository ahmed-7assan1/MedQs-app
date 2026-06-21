import { Telegraf, Context } from "telegraf";
import { getLinkedUser } from "./helpers";
import { mainGuestKeyboard, mainMenuKeyboard } from "./keyboards";

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

export function registerStart(bot: Telegraf) {
  bot.start(async (ctx) => {
    try {
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);

      if (linked) {
        await ctx.reply(
          `🎉 *Welcome back, Dr. ${linked.name}!*\n\n` +
          `*University:* ${linked.university?.name ?? "N/A"}\n` +
          `*Semester:* ${linked.semester?.name ?? "N/A"}\n` +
          `*Points:* ${linked.points ?? 0}\n\n` +
          `What would you like to do today?`,
          { parse_mode: "Markdown", reply_markup: mainMenuKeyboard().reply_markup }
        );
      } else {
        await ctx.reply(
          `🎉 *Welcome to MedOneX Bot!*\n\n` +
          `Your AI-powered medical study assistant 🤖\n\n` +
          `*Available Features:*\n` +
          `💬 *AI Chat* — Ask medical questions, get instant answers\n` +
          `📚 *Modules* — Browse study materials by year & semester\n` +
          `🔑 *Sign In* — Link your MedOneX account for full access\n` +
          `📞 *Contact Support* — Get help from our team\n\n` +
          `Choose an option below to get started:`,
          { parse_mode: "Markdown", reply_markup: mainGuestKeyboard().reply_markup }
        );
      }
    } catch (e) {
      console.error("start error:", e);
      try {
        await ctx.reply(
          "🎉 *Welcome to MedOneX Bot!*\n\nSomething went wrong. Please try /start again.",
          { parse_mode: "Markdown", reply_markup: mainGuestKeyboard().reply_markup }
        );
      } catch (_) {}
    }
  });

  bot.help(async (ctx) => {
    try {
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);

      const helpText = linked
        ? `*🤖 MedOneX Bot Help*\n\n` +
          `*Available Commands:*\n` +
          `/start — Return to main menu\n` +
          `/help — Show this help message\n` +
          `/modules — Browse study modules\n\n` +
          `*Features:*\n` +
          `• *AI Chat* — Ask medical questions using your API keys\n` +
          `• *Modules* — Browse and study course materials\n` +
          `• *Contact Support* — Get help from our team\n\n` +
          `Need more help? Contact our support team.`
        : `*🤖 MedOneX Bot Help*\n\n` +
          `*Available Commands:*\n` +
          `/start — Start the bot and see the menu\n` +
          `/help — Show this help message\n\n` +
          `*Quick Start:*\n` +
          `1. Sign in with your MedOneX account\n` +
          `2. Set up your API keys\n` +
          `3. Start asking medical questions!\n\n` +
          `Sign in to unlock all features.`;

      await ctx.reply(helpText, { parse_mode: "Markdown" });
    } catch (e) {
      console.error("help error:", e);
    }
  });

  bot.command("modules", async (ctx) => {
    try {
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);
      await ctx.reply(
        "📚 *Modules*\n\nSelect a year to browse available modules:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎉 First Year", callback_data: "grade|1" }],
              [{ text: "🎉 Second Year", callback_data: "grade|2" }],
              [{ text: "🎉 Third Year", callback_data: "grade|3" }],
              [{ text: "🎉 Fourth Year", callback_data: "grade|4" }],
              [{ text: "🎉 Fifth Year", callback_data: "grade|5" }],
              [{ text: "🎉 Sixth Year", callback_data: "grade|6" }],
              [{ text: linked ? "🏠 Main Menu" : "🏠 Main Menu", callback_data: "back_main" }],
            ],
          },
        }
      );
    } catch (e) {
      console.error("modules command error:", e);
    }
  });
}
