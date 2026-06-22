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

  bot.action("set_ai", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const state = await getBotState(ctx.from!.id.toString());
      const current = state.provider || "gemini";
      const providers = [
        { label: "Gemini", id: "gemini", emoji: "🔮" },
        { label: "Groq", id: "groq", emoji: "⚡" },
        { label: "DuckDuckGo", id: "duckduckgo", emoji: "🦆" },
        { label: "OpenRouter", id: "openrouter", emoji: "🌐" },
        { label: "SiliconFlow", id: "siliconflow", emoji: "💎" },
        { label: "DeepSeek", id: "deepseek", emoji: "🧊" },
        { label: "xAI (Grok)", id: "xai", emoji: "🤖" },
        { label: "HuggingFace", id: "huggingface", emoji: "🤗" },
        { label: "Mistral", id: "mistral", emoji: "🌬️" },
      ];
      const rows = [];
      for (let i = 0; i < providers.length; i += 2) {
        const row = [];
        for (let j = i; j < i + 2 && j < providers.length; j++) {
          const p = providers[j];
          const isActive = p.id === current;
          row.push({ text: `${isActive ? "✅ " : ""}${p.emoji} ${p.label}`, callback_data: `ai_provider|${p.id}` });
        }
        rows.push(row);
      }
      rows.push([{ text: "⬅ Back", callback_data: "back_main" }]);
      await ctx.editMessageText(
        `🤖 *Change AI Model*\n\nCurrent provider: *${current}*\n\nSelect a provider:`,
        { parse_mode: "Markdown", reply_markup: { inline_keyboard: rows } }
      );
    } catch (e: any) {
      console.error("set_ai error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action(/^ai_provider\|(.+)$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const provider = ctx.match![1];
      const tid = ctx.from!.id.toString();

      if (provider === "duckduckgo") {
        await updateBotState(tid, { provider, apiKey: null });
        await ctx.editMessageText(
          `✅ *Provider changed to DuckDuckGo* 🦆\n\nNo API key needed — it's free!`,
          { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "⬅ Back", callback_data: "back_main" }]] } }
        );
        return;
      }

      const isGroup = ctx.callbackQuery?.message?.chat?.type === "group" || ctx.callbackQuery?.message?.chat?.type === "supergroup";
      if (isGroup) {
        await updateBotState(tid, { provider, chatState: "AWAITING_API_KEY" });
        await ctx.editMessageText(
          `🔑 *Send your API key for ${provider} via private message*\n\nMessage me here: @${ctx.botInfo?.username || "MedOneX_bot"}\n\nType /skip in DM to use the default key.`,
          { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "⬅ Back", callback_data: "back_main" }]] } }
        );
        return;
      }

      await updateBotState(tid, { provider, chatState: "AWAITING_API_KEY" });
      await ctx.editMessageText(
        `🔑 *Enter your API key for ${provider}*\n\nSend me your API key in a message.\n\nType /skip to use the default key.`,
        { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "⬅ Cancel", callback_data: "back_main" }]] } }
      );
    } catch (e: any) {
      console.error("ai_provider error:", e);
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

      if (state.chatState === "AWAITING_API_KEY") {
        const text = (ctx.message as any).text?.trim();
        if (!text || text === "/skip") {
          await updateBotState(tid, { chatState: "IDLE", apiKey: null });
          await ctx.reply(`✅ Using default key for ${state.provider || "gemini"}.`);
          return;
        }
        await updateBotState(tid, { chatState: "IDLE", apiKey: text });
        await ctx.reply(`✅ *API key saved for ${state.provider || "gemini"}!*`, { parse_mode: "Markdown" });
        try { await (ctx as any).deleteMessage().catch(() => {}); } catch (_) {}
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
