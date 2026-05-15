import { Hono } from 'hono';
import { Telegraf, Markup, Context } from 'telegraf';
import { neon } from '@neondatabase/serverless';

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_3?: string;
  GEMINI_API_KEY_4?: string;
  TELEGRAM_STORAGE_GROUP_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── Bot Instance Factory ───
const getBot = (env: Bindings) => {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
  const sql = neon(env.DATABASE_URL);
  const BASE_URL = env.NEXTAUTH_URL || 'https://medonex.vercel.app';
  const STORAGE_GROUP_ID = env.TELEGRAM_STORAGE_GROUP_ID || "-1003146628517";

  // Init Bot State Table (Runs silently)
  const initDb = async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "TelegramBotState" (
          "telegramId" TEXT PRIMARY KEY,
          "provider" TEXT DEFAULT 'gemini',
          "apiKey" TEXT,
          "chatState" TEXT DEFAULT 'IDLE'
        );
      `;
      // Ensure tempEmail column exists
      try {
        await sql`ALTER TABLE "TelegramBotState" ADD COLUMN "tempEmail" TEXT`;
      } catch (e) { /* Column likely already exists */ }
    } catch (e) {
      console.error("DB Init error:", e);
    }
  };

  const getBotState = async (telegramId: string) => {
    const [state] = await sql`SELECT * FROM "TelegramBotState" WHERE "telegramId" = ${telegramId}`;
    if (!state) {
      await sql`INSERT INTO "TelegramBotState" ("telegramId") VALUES (${telegramId})`;
      return { provider: 'gemini', apiKey: null, chatState: 'IDLE', tempEmail: null };
    }
    return state;
  };

  const updateBotState = async (telegramId: string, updates: { provider?: string|null, apiKey?: string|null, chatState?: string|null, tempEmail?: string|null }) => {
    if (updates.provider !== undefined) {
      await sql`UPDATE "TelegramBotState" SET "provider" = ${updates.provider} WHERE "telegramId" = ${telegramId}`;
    }
    if (updates.apiKey !== undefined) {
      await sql`UPDATE "TelegramBotState" SET "apiKey" = ${updates.apiKey} WHERE "telegramId" = ${telegramId}`;
    }
    if (updates.chatState !== undefined) {
      await sql`UPDATE "TelegramBotState" SET "chatState" = ${updates.chatState} WHERE "telegramId" = ${telegramId}`;
    }
    if (updates.tempEmail !== undefined) {
      await sql`UPDATE "TelegramBotState" SET "tempEmail" = ${updates.tempEmail} WHERE "telegramId" = ${telegramId}`;
    }
  };

  // Helpers
  const getLinkedUser = async (telegramId: string) => {
    // Check direct link
    const [user] = await sql`
      SELECT u.*, uni.name as university_name, sem.name as semester_name 
      FROM "User" u 
      LEFT JOIN "University" uni ON u."universityId" = uni.id 
      LEFT JOIN "Semester" sem ON u."semesterId" = sem.id 
      WHERE u."telegramId" = ${telegramId.toString()} 
      LIMIT 1
    `;
    if (user) return user;

    // Check phone link
    try {
      const [botUser] = await sql`SELECT "phoneNumber" FROM "BotUser" WHERE "telegramId" = ${telegramId.toString()} LIMIT 1`;
      if (botUser?.phoneNumber) {
        const [uByPhone] = await sql`SELECT id FROM "User" WHERE "telegramPhone" = ${botUser.phoneNumber} LIMIT 1`;
        if (uByPhone) {
          await sql`UPDATE "User" SET "telegramId" = ${telegramId.toString()}, "telegramVerified" = true WHERE id = ${uByPhone.id}`;
          return getLinkedUser(telegramId);
        }
      }
    } catch (e) { } // Ignore if BotUser table is missing
    return null;
  };

  const MAIN_KEYBOARD = Markup.keyboard([
    [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
    [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
    [{ text: "👤 My Profile" }],
    [Markup.button.webApp("🚀 Open MedOneX TMA", `${BASE_URL}/tma`)]
  ]).resize();

  bot.start(async (ctx) => {
    await initDb();
    const user = await getLinkedUser(ctx.from.id.toString());
    if (user) {
      await ctx.reply(
        `Welcome back, Dr. ${user.name}! 🩺🌌\n\n` +
        `🏫 *University:* ${user.university_name || "N/A"}\n` +
        `📚 *Current Semester:* ${user.semester_name || "N/A"}\n\n` +
        `How can I help you today?`, 
        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
      );
    } else {
      await ctx.reply(`Welcome to MedOneX! 🩺🌌\n\nPlease link your account to get started.`, 
        Markup.inlineKeyboard([[Markup.button.callback('🔑 Link via Email', 'auth_email')]])
      );
    }
  });

  bot.action('auth_email', async (ctx) => {
    await updateBotState(ctx.from!.id.toString(), { chatState: 'AWAITING_EMAIL' });
    await ctx.reply("📧 Please enter your registered email address:");
  });

  const verifySupabaseAuth = async (email: string, password: string) => {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.user;
    } catch (e) {
      console.error("Auth Fetch Error:", e);
      return null;
    }
  };

  // ─── Command Handlers ───
  bot.hears("📚 My Modules", async (ctx) => {
    const user = await getLinkedUser(ctx.from.id.toString());
    if (!user) return ctx.reply("Please link your account first.");
    
    const modules = await sql`SELECT * FROM "Module" WHERE "semesterId" = ${user.semesterId} LIMIT 10`;
    if (modules.length === 0) return ctx.reply("No modules found for your semester.");
    
    const buttons = modules.map(m => [Markup.button.callback(`📖 ${m.name}`, `mod_${m.id}`)]);
    await ctx.reply("🎯 Your Current Modules:", Markup.inlineKeyboard(buttons));
  });

  bot.hears("📊 Dashboard", async (ctx) => {
    const user = await getLinkedUser(ctx.from.id.toString());
    if (!user) return ctx.reply("Please link your account first.");
    await ctx.reply(`🚀 Access your personalized dashboard here:\n${BASE_URL}/dashboard`, 
      Markup.inlineKeyboard([[Markup.button.url("🌐 Open Dashboard", `${BASE_URL}/dashboard`)]])
    );
  });

  bot.hears("👤 My Profile", async (ctx) => {
    const user = await getLinkedUser(ctx.from.id.toString());
    if (!user) return ctx.reply("Please link your account first.");
    
    await ctx.reply(
      `👤 *Student Profile*\n\n` +
      `🆔 *Name:* ${user.name}\n` +
      `📧 *Email:* ${user.email}\n` +
      `🏫 *Uni:* ${user.university_name}\n` +
      `📚 *Sem:* ${user.semester_name}\n` +
      `⭐ *Points:* ${user.points || 0}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.hears("⚙️ Settings", async (ctx) => {
    await initDb();
    const state = await getBotState(ctx.from.id.toString());
    const aiProv = state.provider.toUpperCase();
    const hasKey = state.apiKey ? "✅ Configured" : "❌ Not Configured";

    await ctx.reply(`⚙️ *Bot Settings*\n\n🤖 *Current AI:* ${aiProv}\n🔑 *API Key:* ${hasKey}\n\nChoose an option to customize:`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🤖 Change AI Model", "set_ai")],
        [Markup.button.callback("🔑 Manage API Key", "manage_key")],
        [Markup.button.callback("🚪 Logout / Unlink", "logout")]
      ])
    });
  });

  bot.action("logout", async (ctx) => {
    const tid = ctx.from!.id.toString();
    try {
      await sql`UPDATE "User" SET "telegramId" = NULL, "telegramVerified" = false WHERE "telegramId" = ${tid}`;
      await ctx.editMessageText("🚪 *Logged out successfully.*\n\nYour account has been unlinked from this Telegram ID. Send /start to link again.", { parse_mode: 'Markdown' });
    } catch (e) {
      await ctx.answerCbQuery("Error during logout. Please try again.");
    }
  });

  // ─── AI BYOK Settings ───
  bot.action("set_ai", async (ctx) => {
    await ctx.editMessageText("🤖 *Select your preferred AI Brain (BioC):*", {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("✨ Google Gemini", "ai_gemini")],
        [Markup.button.callback("⚡ Groq (LLaMA-3)", "ai_groq")],
        [Markup.button.callback("🧠 OpenAI (ChatGPT)", "ai_openai")],
        [Markup.button.callback("🟣 Anthropic (Claude)", "ai_anthropic")]
      ])
    });
  });

  const setupAiProvider = async (ctx: Context, provider: string, keyUrl: string) => {
    await updateBotState(ctx.from!.id.toString(), { provider, chatState: `AWAITING_KEY_${provider.toUpperCase()}` });
    await ctx.editMessageText(
      `You selected *${provider.toUpperCase()}*.\n\n` +
      `To use this model at ultra-fast speeds bypassing Vercel limits, please provide your own API key.\n\n` +
      `🔗 [Get your API Key Here](${keyUrl})\n\n` +
      `*Reply to this message* with your API key to save it securely.`,
      { parse_mode: 'Markdown' }
    );
  };

  bot.action("ai_gemini", async (ctx) => setupAiProvider(ctx, 'gemini', 'https://aistudio.google.com/app/apikey'));
  bot.action("ai_groq", async (ctx) => setupAiProvider(ctx, 'groq', 'https://console.groq.com/keys'));
  bot.action("ai_openai", async (ctx) => setupAiProvider(ctx, 'openai', 'https://platform.openai.com/api-keys'));
  bot.action("ai_anthropic", async (ctx) => setupAiProvider(ctx, 'anthropic', 'https://console.anthropic.com/settings/keys'));

  bot.action("manage_key", async (ctx) => {
    await updateBotState(ctx.from!.id.toString(), { apiKey: null });
    await ctx.editMessageText("🗑️ *API Key cleared.*\n\nPlease select an AI Model again to set a new key.", {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback("🤖 Change AI Model", "set_ai")]])
    });
  });

  // ─── Action Handlers (Inline Buttons) ───
  bot.action(/^mod_(.+)$/, async (ctx) => {
    const moduleId = ctx.match[1];
    if (moduleId === 'back') {
      const user = await getLinkedUser(ctx.from!.id.toString());
      if (!user) return;
      const modules = await sql`SELECT * FROM "Module" WHERE "semesterId" = ${user.semesterId} LIMIT 10`;
      const buttons = modules.map(m => [Markup.button.callback(`📖 ${m.name}`, `mod_${m.id}`)]);
      await ctx.editMessageText("🎯 Your Current Modules:", Markup.inlineKeyboard(buttons));
      return;
    }
    const subjects = await sql`SELECT * FROM "Subject" WHERE "moduleId" = ${moduleId} LIMIT 10`;
    
    if (subjects.length === 0) return ctx.answerCbQuery("No subjects found in this module.");
    
    const buttons = subjects.map(s => [Markup.button.callback(`📁 ${s.name}`, `sub_${s.id}`)]);
    buttons.push([Markup.button.callback("⬅️ Back to Modules", "mod_back")]);
    await ctx.editMessageText("📂 Select a Subject:", Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery();
  });

  bot.action(/^sub_(.+)$/, async (ctx) => {
    const subjectId = ctx.match[1];
    const lectures = await sql`SELECT * FROM "Lecture" WHERE "subjectId" = ${subjectId} ORDER BY "order" ASC LIMIT 10`;
    
    if (lectures.length === 0) return ctx.answerCbQuery("No lectures found.");
    
    const buttons = lectures.map(l => [Markup.button.callback(`📖 ${l.title}`, `lec_${l.id}`)]);
    buttons.push([Markup.button.callback("⬅️ Back to Modules", "mod_back")]);
    await ctx.editMessageText("📄 Choose a Lecture:", Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery();
  });

  bot.action(/^lec_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const lec = (await sql`SELECT * FROM "Lecture" WHERE "id" = ${lecId}`)[0];
    if(!lec) return;
    
    const buttons = [
      [Markup.button.callback("🎥 Videos", `vids_${lecId}`), Markup.button.callback("📁 Files", `files_${lecId}`)],
      [Markup.button.callback("📝 Quiz", `quiz_${lecId}`)],
      [Markup.button.callback("⬅️ Back to Subjects", "mod_back")]
    ];
    
    await ctx.editMessageText(`🎓 *Lecture: ${lec.title}*\n\nWhat would you like to access?`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    await ctx.answerCbQuery();
  });

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  bot.action(/^vids_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const vids = await sql`SELECT * FROM "LectureVideo" WHERE "lectureId" = ${lecId} LIMIT 5`;
    if (vids.length === 0) return ctx.answerCbQuery("No videos found.");
    
    for (const v of vids) {
      let msgId = v.telegramMessageId;
      if (!msgId) {
        try {
          const cacheMsg = await ctx.telegram.sendMessage(STORAGE_GROUP_ID, `🎥 *VIDEO CACHE*\n📝 ${v.title}\n🔗 ${v.url}`, { parse_mode: 'Markdown' });
          msgId = cacheMsg.message_id.toString();
          await sql`UPDATE "LectureVideo" SET "telegramMessageId" = ${msgId}, "telegramChatId" = ${STORAGE_GROUP_ID} WHERE "id" = ${v.id}`;
          await delay(1000);
        } catch (e) {
          await ctx.reply(`🎥 *${v.title}*\n🔗 [Watch](${v.url})`, { parse_mode: 'Markdown' });
          continue;
        }
      }
      try {
        await ctx.telegram.copyMessage(ctx.chat!.id, STORAGE_GROUP_ID, parseInt(msgId));
        await delay(1000);
      } catch (e) {}
    }
    await ctx.answerCbQuery();
  });

  bot.action(/^files_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const files = await sql`SELECT * FROM "LectureFile" WHERE "lectureId" = ${lecId} LIMIT 5`;
    if (files.length === 0) return ctx.answerCbQuery("No files found.");
    
    for (const f of files) {
      let msgId = f.telegramMessageId;
      if (!msgId) {
        try {
          const cacheMsg = await ctx.telegram.sendMessage(STORAGE_GROUP_ID, `📄 *FILE CACHE*\n📝 ${f.name}\n🔗 ${f.url}`, { parse_mode: 'Markdown' });
          msgId = cacheMsg.message_id.toString();
          await sql`UPDATE "LectureFile" SET "telegramMessageId" = ${msgId}, "telegramChatId" = ${STORAGE_GROUP_ID} WHERE "id" = ${f.id}`;
          await delay(1000);
        } catch (e) {
          await ctx.reply(`📄 *${f.name}*\n🔗 [Download](${f.url})`, { parse_mode: 'Markdown' });
          continue;
        }
      }
      try {
        await ctx.telegram.copyMessage(ctx.chat!.id, STORAGE_GROUP_ID, parseInt(msgId));
        await delay(1000);
      } catch (e) {}
    }
    await ctx.answerCbQuery();
  });

  bot.action(/^quiz_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const questions = await sql`SELECT * FROM "Question" WHERE "lectureId" = ${lecId} LIMIT 5`;
    if (questions.length === 0) return ctx.answerCbQuery("No questions found.");
    
    await ctx.reply(`📝 *Starting Quiz* (Top 5 Questions)\n\nAnswer directly below:`, { parse_mode: 'Markdown' });
    
    for (const q of questions) {
      try {
        await delay(2000); 
        if (q.telegramMessageId) {
          try {
            await ctx.telegram.copyMessage(ctx.chat!.id, STORAGE_GROUP_ID, parseInt(q.telegramMessageId));
            continue;
          } catch (e) { }
        }

        let choices = q.choices;
        if (typeof choices === 'string') choices = JSON.parse(choices);
        
        let options: string[] = [];
        let correctIdx = 0;

        if (Array.isArray(choices)) {
          if (choices[0] && typeof choices[0] === 'object' && 'text' in choices[0]) {
            options = choices.map((c: any) => c.text);
            const dbAnswer = q.answer.trim().toUpperCase();
            correctIdx = choices.findIndex((c: any) => c.key === dbAnswer || c.text === q.answer);
          } else {
            options = choices;
            correctIdx = options.findIndex(opt => opt === q.answer);
          }
        }

        if (options.length === 0) continue;
        if (correctIdx === -1) correctIdx = 0;

        const safeBody = q.body.length > 250 ? q.body.substring(0, 250) + "..." : q.body;
        const safeOptions = options.map((opt: string) => opt.length > 100 ? opt.substring(0, 97) + "..." : opt);
        const safeExpl = (q.explanation || q.aiExplanation || "").substring(0, 195);

        const cacheMsg = await ctx.telegram.sendPoll(STORAGE_GROUP_ID, safeBody, safeOptions, {
          type: 'quiz',
          correct_option_id: correctIdx,
          explanation: safeExpl,
          explanation_parse_mode: 'Markdown'
        } as any);

        await ctx.telegram.copyMessage(ctx.chat!.id, STORAGE_GROUP_ID, cacheMsg.message_id);
        await sql`UPDATE "Question" SET "telegramMessageId" = ${cacheMsg.message_id.toString()}, "telegramChatId" = ${STORAGE_GROUP_ID} WHERE "id" = ${q.id}`;
        
      } catch (err) {
        console.error("Quiz Error:", err);
      }
    }
    await ctx.answerCbQuery();
  });

  // ─── AI Interaction & Fallback ───
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const tid = ctx.from.id.toString();

    await initDb();
    const state = await getBotState(tid);

    // 1. Check if user is inputting an API Key
    if (state.chatState.startsWith("AWAITING_KEY_")) {
      await updateBotState(tid, { apiKey: text.trim(), chatState: 'IDLE' });
      await ctx.reply(`✅ *API Key Saved successfully!* \n\nYour provider is set to *${state.provider.toUpperCase()}*.\nYou can now ask Dr. Q any questions.`, { parse_mode: 'Markdown' });
      return;
    }

    // 2. Check if user is inputting Email
    if (state.chatState === 'AWAITING_EMAIL') {
      await updateBotState(tid, { tempEmail: text.trim(), chatState: 'AWAITING_PASSWORD' });
      await ctx.reply("🔐 Excellent. Now please enter your password (it will be deleted for security):");
      return;
    }

    // 3. Check if user is inputting Password
    if (state.chatState === 'AWAITING_PASSWORD') {
      const tempEmail = state.tempEmail;
      if (!tempEmail) {
        await updateBotState(tid, { chatState: 'IDLE' });
        return ctx.reply("Something went wrong. Please try /start again.");
      }

      // Try to delete the password message for security
      try { await ctx.deleteMessage(); } catch (e) { }

      const supabaseUser = await verifySupabaseAuth(tempEmail, text.trim());
      if (supabaseUser) {
        // Link user in Prisma DB
        const [userInDb] = await sql`SELECT id FROM "User" WHERE "email" = ${tempEmail} LIMIT 1`;
        if (userInDb) {
          await sql`UPDATE "User" SET "telegramId" = ${tid}, "telegramVerified" = true WHERE id = ${userInDb.id}`;
          await updateBotState(tid, { chatState: 'IDLE', tempEmail: null });
          await ctx.reply("✅ Account linked successfully! Welcome to MedOneX ecosystem.", MAIN_KEYBOARD);
        } else {
          await ctx.reply("❌ Account verified but profile not found in database. Please contact support.");
          await updateBotState(tid, { chatState: 'IDLE', tempEmail: null });
        }
      } else {
        await ctx.reply("❌ Invalid credentials. Connection rejected.", Markup.inlineKeyboard([[Markup.button.callback('🔑 Try Again', 'auth_email')]]));
        await updateBotState(tid, { chatState: 'IDLE', tempEmail: null });
      }
      return;
    }

    const user = await getLinkedUser(tid);
    if (!user) {
      if (text === "🧠 Ask Dr. Q") return ctx.reply("Please link your account first to use Dr. Q.");
      return ctx.reply("Please link your account first.");
    }
    
    if (text === "🧠 Ask Dr. Q") {
      return ctx.reply("🩺 *I am Dr. Q, your medical assistant.*\n\nYou can ask me anything! To customize my brain or use your own API key, go to *⚙️ Settings*.", { parse_mode: 'Markdown' });
    }
    
    // Process AI Chat
    const promptContext = `
      System: You are Dr. Q, an elite AI medical tutor for MedOneX. 
      Instructions:
      - Respond concisely and professionally in Telegram Markdown.
      - You are bilingual in Arabic and English.
      - Use bold for medical terms.
      - If explaining procedures, use bullet points.
      - Scope: Medicine, Clinical Reasoning, and Study Skills only.

      Student Profile:
      - Name: ${user.name}
      - University: ${user.university_name || 'Unknown'}
      - Semester: ${user.semester_name || 'Unknown'}

      Current Query: ${text}
    `;

    try {
      let reply = "I'm not sure how to respond to that.";
      const provider = state.provider;
      const userApiKey = state.apiKey;
      const platformKey = env.GEMINI_API_KEY;

      // 1. If using non-Gemini providers, require user key
      if (provider !== 'gemini' && !userApiKey) {
        await ctx.reply(
          `⚠️ *API Key Required*\n\nYou selected *${provider.toUpperCase()}* but haven't provided an API key yet.\n\n` +
          `Please go to *⚙️ Settings → 🤖 Change AI Model* to set it up, or switch back to Gemini for free access.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // 2. Execute based on provider
      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama3-70b-8192', messages: [{ role: 'user', content: promptContext }] })
        });
        const data: any = await res.json();
        reply = data?.choices?.[0]?.message?.content || "No response from Groq.";
      } 
      else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: promptContext }] })
        });
        const data: any = await res.json();
        reply = data?.choices?.[0]?.message?.content || "No response from OpenAI.";
      }
      else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': userApiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1024, messages: [{ role: 'user', content: promptContext }] })
        });
        const data: any = await res.json();
        reply = data?.content?.[0]?.text || "No response from Claude.";
      }
      else {
        // Gemini - PRIORITIZE user key (BYOK), fallback to platform key rotation
        const userApiKey = state.apiKey;
        const platformKeys = [
          env.GEMINI_API_KEY,
          env.GEMINI_API_KEY_2,
          env.GEMINI_API_KEY_3,
          env.GEMINI_API_KEY_4
        ].filter(Boolean);
        
        const activeKey = userApiKey || platformKeys[Math.floor(Math.random() * platformKeys.length)];
        if (!activeKey) throw new Error("MISSING_KEY");

        // Try gemini-1.5-flash first, fallback to gemini-1.5-pro if needed
        const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
        let lastErr = "";

        for (const model of models) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${activeKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptContext }] }] })
            });
            const data: any = await res.json();
            if (res.ok) {
              reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
              break; // Success!
            } else {
              lastErr = data?.error?.message || "Unknown API Error";
              if (lastErr.includes("API key not valid")) throw new Error("INVALID_API_KEY");
              continue; // Try next model
            }
          } catch (innerE: any) {
            if (innerE.message === "INVALID_API_KEY") throw innerE;
            lastErr = innerE.message;
            continue;
          }
        }
        
        if (!reply || reply === "I'm not sure how to respond to that.") {
          throw new Error(lastErr || "All Gemini models failed.");
        }
      }

      await ctx.reply(reply, { parse_mode: 'Markdown' });

    } catch (e: any) {
      console.error("Bot AI Error:", e);
      if (e.message === "MISSING_KEY") {
        await ctx.reply("⚠️ AI is currently unavailable (Missing API Key). Please contact an admin.");
      } else if (e.message === "INVALID_API_KEY") {
        await ctx.reply("❌ *Invalid API Key detected.*\n\nPlease go to *⚙️ Settings → 🔑 Manage API Key* to clear it and provide a valid one.", { parse_mode: 'Markdown' });
      } else {
        await ctx.reply(`🩺 *Dr. Q is temporarily resting.*\n\nError: ${e.message || "Unknown connectivity issue"}`);
      }
    }
  });

  return bot;
};

app.post('/api/telegram', async (c) => {
  const bot = getBot(c.env);
  const body = await c.req.json();
  await bot.handleUpdate(body);
  return c.json({ ok: true });
});

export default app;

