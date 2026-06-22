import { Telegraf, Markup } from "telegraf";
import { getLinkedUser, updateBotState, getSql } from "./helpers";
import { replyKeyboard, mainGuestKeyboard, mainMenuKeyboard, gradeKeyboard } from "./keyboards";

export function registerStart(bot: Telegraf, env: Record<string, string | undefined>) {
  const BASE_URL = env.NEXTAUTH_URL || "https://medqs.app";

  bot.start(async (ctx) => {
    try {
      const sql = getSql();
      const tid = ctx.from.id.toString();
      const linked = await getLinkedUser(tid);

      if (linked) {
        await ctx.reply(
          `🎉 *Welcome back, Dr. ${linked.name}!*\n\n` +
          `🏛️ *Uni:* ${linked.university_name ?? "N/A"}\n` +
          `🏫 *Faculty:* ${linked.faculty_name ?? "N/A"}\n` +
          `📅 *Year:* ${linked.academic_year ?? "N/A"}\n` +
          `📖 *Semester:* ${linked.semester_name ?? "N/A"}\n` +
          `⭐ *Points:* ${linked.points ?? 0}\n\n` +
          `What would you like to do today?`,
          { parse_mode: "Markdown", ...replyKeyboard() }
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
          { parse_mode: "Markdown", ...replyKeyboard() }
        );
      }
    } catch (e) {
      console.error("start error:", e);
      try {
        await ctx.reply("🎉 Welcome to MedOneX Bot!\n\nPlease try /start again.", {
          parse_mode: "Markdown",
          ...replyKeyboard(),
        });
      } catch (_) {}
    }
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      "*🤖 MedOneX Bot Help*\n\n" +
      "*Commands:*\n" +
      "/start — Main menu\n" +
      "/help — This message\n" +
      "/modules — Browse modules\n\n" +
      "Need help? Contact support via the menu.",
      { parse_mode: "Markdown", ...replyKeyboard() }
    );
  });

  bot.command("modules", async (ctx) => {
    await ctx.reply("📚 *Modules*\n\nSelect a year:", {
      parse_mode: "Markdown",
      ...gradeKeyboard(),
    });
  });

  bot.action("modules", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.editMessageText("📚 *Modules*\n\nSelect a year:", {
        parse_mode: "Markdown",
        ...gradeKeyboard(),
      });
    } catch (e: any) {
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  // ─── Reply keyboard handlers ───

  bot.hears("🧠 Ask Dr. Q", async (ctx) => {
    try {
      const sql = getSql();
      const tid = ctx.from.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.reply("🔑 *Sign In Required*\n\nPlease sign in to use AI Chat with your personal API keys, or try free mode.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
              [{ text: "💬 Try Free AI", callback_data: "ai_guest" }],
            ],
          },
        });
        return;
      }
      await updateBotState(tid, { chatState: "AI_CHAT" });
      await ctx.reply(
        "🤖 *AI Chat*\n\nI'm your medical study assistant. Send me your question:",
        { parse_mode: "Markdown", ...replyKeyboard() }
      );
    } catch (e: any) {
      await ctx.reply(`⚠️ Error: ${e.message || "Please try again."}`, replyKeyboard());
    }
  });

  bot.hears("📚 My Modules", async (ctx) => {
    try {
      const sql = getSql();
      const tid = ctx.from.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.reply("🔑 *Sign In Required*\n\nPlease sign in to browse your modules and study materials.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      const modules = await sql`SELECT * FROM "Module" WHERE "semesterId" = ${linked.semesterId} LIMIT 10`;
      if (modules.length === 0) {
        await ctx.reply("No modules found for your semester.", replyKeyboard());
        return;
      }
      await ctx.reply("🎯 Your Current Modules:", {
        reply_markup: Markup.inlineKeyboard(
          modules.map((m: any) => [Markup.button.callback(`📖 ${m.name}`, `mod_${m.id}`)])
        ).reply_markup,
      });
    } catch (e: any) {
      await ctx.reply(`⚠️ Error: ${e.message}`, replyKeyboard());
    }
  });

  bot.hears("📊 Dashboard", async (ctx) => {
    try {
      const sql = getSql();
      const linked = await getLinkedUser(ctx.from.id.toString());
      if (!linked) {
        await ctx.reply("🔑 *Sign In Required*\n\nPlease sign in to access your dashboard and track progress.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      await ctx.reply(
        `🚀 Access your dashboard here:\n${BASE_URL}/dashboard`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "🌐 Open Dashboard", url: `${BASE_URL}/dashboard` }]],
          },
        }
      );
    } catch (e: any) {
      await ctx.reply(`⚠️ Error: ${e.message}`, replyKeyboard());
    }
  });

  bot.hears("⚙️ Settings", async (ctx) => {
    try {
      const sql = getSql();
      const tid = ctx.from.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.reply("🔑 *Sign In Required*\n\nPlease sign in to manage your settings.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      await ctx.reply(
        `⚙️ *Settings*\n\nAccount: *${linked.name}*\nEmail: \`${linked.email}\``,
        {
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🤖 Change AI Model", "set_ai")],
            [Markup.button.callback("🚪 Logout", "confirm_logout")],
          ]).reply_markup,
        }
      );
    } catch (e: any) {
      await ctx.reply(`⚠️ Error: ${e.message}`, replyKeyboard());
    }
  });

  bot.hears("👤 My Profile", async (ctx) => {
    try {
      const sql = getSql();
      const linked = await getLinkedUser(ctx.from.id.toString());
      if (!linked) {
        await ctx.reply("🔑 *Sign In Required*\n\nPlease sign in to view your profile and progress.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      await ctx.reply(
        `👤 *Student Profile*\n\n` +
        `🆔 *Name:* ${linked.name}\n` +
        `📧 *Email:* ${linked.email}\n` +
        `🏛️ *Uni:* ${linked.university_name || "N/A"}\n` +
        `🏫 *Faculty:* ${linked.faculty_name || "N/A"}\n` +
        `📅 *Year:* ${linked.academic_year || "N/A"}\n` +
        `📖 *Semester:* ${linked.semester_name || "N/A"}\n` +
        `⭐ *Points:* ${linked.points || 0}`,
        { parse_mode: "Markdown", ...replyKeyboard() }
      );
    } catch (e: any) {
      await ctx.reply(`⚠️ Error: ${e.message}`, replyKeyboard());
    }
  });

  bot.hears("🚀 Open MedOneX TMA", async (ctx) => {
    await ctx.reply("🌐 Opening MedOneX...", {
      reply_markup: {
        inline_keyboard: [[{ text: "🚀 Open MedOneX TMA", url: BASE_URL }]],
      },
    });
  });

  bot.action("back_main", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const sql = getSql();
      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      if (linked) {
        await ctx.editMessageText(`🏠 *Main Menu*\n\nWelcome, *${linked.name}* 👋`, {
          parse_mode: "Markdown",
          ...replyKeyboard(),
        });
      } else {
        await ctx.editMessageText("🏠 *MedOneX Bot*\n\nYour AI-powered medical study assistant.", {
          parse_mode: "Markdown",
          ...replyKeyboard(),
        });
      }
    } catch (e: any) {
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });
}
