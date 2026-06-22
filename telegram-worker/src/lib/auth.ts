import { Telegraf, Context } from "telegraf";
import { getLinkedUser, getBotState, updateBotState, validateEmail, getSql } from "./helpers";
import { mainMenuKeyboard, mainGuestKeyboard, cancelKeyboard, confirmLogoutKeyboard } from "./keyboards";

type Bindings = {
  [key: string]: string | undefined;
};

export function registerAuth(bot: Telegraf, env: Bindings) {
  const verifySupabaseAuth = async (email: string, password: string) => {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return data.user;
    } catch (e) {
      console.error("Auth Fetch Error:", e);
      return null;
    }
  };

  bot.action("auth_login_start", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      const existing = await getLinkedUser(tid);
      if (existing) {
        await ctx.editMessageText(
          `✅ *You are already signed in*\n\nWelcome back, *${existing.name}*!`,
          { parse_mode: "Markdown", ...mainMenuKeyboard() }
        );
        return;
      }
      await updateBotState(tid, { chatState: "AWAITING_EMAIL" });
      await ctx.editMessageText(
        "🔑 *Sign In*\n\nPlease enter your registered *email address*:",
        { parse_mode: "Markdown", ...cancelKeyboard() }
      );
    } catch (e: any) {
      console.error("auth_login_start error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action("auth_register", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "📝 *Register*\n\nPlease visit MedOneX to create an account:\nhttps://medqs.app\n\nAfter registering, come back and tap *Sign In*.",
        { parse_mode: "Markdown", ...mainGuestKeyboard() }
      );
    } catch (e: any) {
      console.error("auth_register error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action("confirm_logout", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.editMessageText("You are not signed in.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      await ctx.editMessageText(
        "🚪 *Confirm Logout*\n\nDisconnect your Telegram from MedOneX?",
        { parse_mode: "Markdown", ...confirmLogoutKeyboard() }
      );
    } catch (e: any) {
      console.error("confirm_logout error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action("logout", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const sql = getSql();
      const tid = ctx.from!.id.toString();
      await sql`UPDATE "User" SET "telegramId" = NULL, "telegramVerified" = false WHERE "telegramId" = ${tid}`;
      await updateBotState(tid, { chatState: "IDLE", tempEmail: null, tempData: null });
      await ctx.editMessageText(
        "✅ *Logged out.*\n\nYour Telegram is no longer linked to MedOneX.",
        { parse_mode: "Markdown", ...mainGuestKeyboard() }
      );
    } catch (e: any) {
      console.error("logout error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action("settings", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.editMessageText("Please sign in to access settings.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
            ],
          },
        });
        return;
      }
      await ctx.editMessageText(
        `⚙ *Settings*\n\nAccount: *${linked.name}*\nEmail: \`${linked.email}\``,
        { parse_mode: "Markdown", ...mainMenuKeyboard() }
      );
    } catch (e: any) {
      console.error("settings error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.on("text", async (ctx, next) => {
    try {
      const sql = getSql();
      const tid = ctx.from!.id.toString();
      const state = await getBotState(tid);

      if (state.chatState === "AWAITING_EMAIL") {
        const email = (ctx.message as any).text?.trim().toLowerCase();
        if (!email || !validateEmail(email)) {
          await ctx.reply("❌ Invalid email. Please try again:", cancelKeyboard());
          return;
        }
        const existing = await getLinkedUser(tid);
        if (existing) {
          await updateBotState(tid, { chatState: "IDLE" });
          await ctx.reply("✅ You are already signed in!", mainMenuKeyboard());
          return;
        }
        const [userInDb] = await sql`SELECT id FROM "User" WHERE "email" = ${email} LIMIT 1`;
        if (!userInDb) {
          await ctx.reply("❌ No account found with that email.", cancelKeyboard());
          return;
        }
        await updateBotState(tid, { chatState: "AWAITING_PASSWORD", tempEmail: email });
        await ctx.reply("🔑 Please enter your *password*:", { parse_mode: "Markdown", ...cancelKeyboard() });
        return;
      }

      if (state.chatState === "AWAITING_PASSWORD") {
        const password = (ctx.message as any).text?.trim();
        const email = state.tempEmail;

        if (!password || !email) {
          await updateBotState(tid, { chatState: "IDLE", tempEmail: null });
          await ctx.reply("❌ Session expired. Please try again.", mainGuestKeyboard());
          return;
        }

        try {
          await (ctx as any).deleteMessage().catch(() => {});
        } catch (_) {}

        const supabaseUser = await verifySupabaseAuth(email, password);
        if (supabaseUser) {
          const [userInDb] = await sql`SELECT id FROM "User" WHERE "email" = ${email} LIMIT 1`;
          if (userInDb) {
            try {
              await sql`UPDATE "User" SET "telegramId" = ${tid}, "telegramVerified" = true WHERE id = ${userInDb.id}`;
            } catch (e: any) {
              if (e?.code === "P2002" || e?.message?.includes("unique")) {
                await ctx.reply("⚠️ This Telegram is already linked to another account.", mainGuestKeyboard());
                await updateBotState(tid, { chatState: "IDLE", tempEmail: null });
                return;
              }
              throw e;
            }
            await updateBotState(tid, { chatState: "IDLE", tempEmail: null });
            const justLinked = await getLinkedUser(tid);
            const profileLines = justLinked
              ? `\n\n🏛️ *Uni:* ${justLinked.university_name || "N/A"}\n🏫 *Faculty:* ${justLinked.faculty_name || "N/A"}\n📅 *Year:* ${justLinked.academic_year || "N/A"}\n📖 *Semester:* ${justLinked.semester_name || "N/A"}`
              : "";
            await ctx.reply(
              `✅ *Sign In Successful!*\n\nWelcome, *${justLinked?.name || ""}*! 🎉${profileLines}`,
              { parse_mode: "Markdown", ...mainMenuKeyboard() }
            );
          } else {
            await ctx.reply("❌ Profile not found. Please contact support.");
            await updateBotState(tid, { chatState: "IDLE", tempEmail: null });
          }
        } else {
          await ctx.reply("❌ Invalid credentials.", {
            reply_markup: { inline_keyboard: [[{ text: "🔑 Try Again", callback_data: "auth_login_start" }]] },
          });
          await updateBotState(tid, { chatState: "IDLE", tempEmail: null });
        }
        return;
      }

      return next();
    } catch (e) {
      console.error("auth text handler error:", e);
      try {
        await ctx.reply("❌ An error occurred. Please try /start.");
      } catch (_) {}
    }
  });
}
