import { Hono } from 'hono';
import { Telegraf, Markup } from 'telegraf';
import { neon } from '@neondatabase/serverless';

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  GEMINI_API_KEY: string;
  TELEGRAM_STORAGE_GROUP_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── Bot Instance Factory ───
const getBot = (env: Bindings) => {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
  const sql = neon(env.DATABASE_URL);
  const BASE_URL = env.NEXTAUTH_URL || 'https://medonex.vercel.app';

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
    const [botUser] = await sql`SELECT "phoneNumber" FROM "BotUser" WHERE "telegramId" = ${telegramId.toString()} LIMIT 1`;
    if (botUser?.phoneNumber) {
      const [uByPhone] = await sql`SELECT id FROM "User" WHERE "telegramPhone" = ${botUser.phoneNumber} LIMIT 1`;
      if (uByPhone) {
        await sql`UPDATE "User" SET "telegramId" = ${telegramId.toString()}, "telegramVerified" = true WHERE id = ${uByPhone.id}`;
        return getLinkedUser(telegramId);
      }
    }
    return null;
  };

  const MAIN_KEYBOARD = Markup.keyboard([
    [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
    [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
    [{ text: "👤 My Profile" }],
    [Markup.button.webApp("🚀 Open MedOneX TMA", `${BASE_URL}/tma`)]
  ]).resize();

  bot.start(async (ctx) => {
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
        Markup.inlineKeyboard([[Markup.button.callback('📱 Link via Phone', 'auth_phone')]])
      );
    }
  });

  bot.action('auth_phone', async (ctx) => {
    await ctx.reply("📱 Please share your contact:", 
      Markup.keyboard([[Markup.button.contactRequest("📤 Share Contact")]]).oneTime().resize()
    );
  });

  bot.on('contact', async (ctx) => {
    const phone = ctx.message.contact.phone_number.replace('+', '');
    await sql`INSERT INTO "BotUser" ("telegramId", "phoneNumber") VALUES (${ctx.from.id.toString()}, ${phone}) ON CONFLICT ("telegramId") DO UPDATE SET "phoneNumber" = ${phone}`;
    await ctx.reply("✅ Phone linked! Try /start now.", Markup.removeKeyboard());
  });

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
    await ctx.reply("⚙️ *Bot Settings*\n\nChoose an option to customize your experience:", {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔔 Notifications", "set_notif")],
        [Markup.button.callback("🤖 AI Model", "set_ai")]
      ])
    });
  });

  // ─── Action Handlers (Inline Buttons) ───
  bot.action(/^mod_(.+)$/, async (ctx) => {
    const moduleId = ctx.match[1];
    const subjects = await sql`SELECT * FROM "Subject" WHERE "moduleId" = ${moduleId} LIMIT 10`;
    
    if (subjects.length === 0) return ctx.answerCbQuery("No subjects found in this module.");
    
    const buttons = subjects.map(s => [Markup.button.callback(`📁 ${s.name}`, `sub_${s.id}`)]);
    await ctx.editMessageText("📂 Select a Subject:", Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery();
  });

  bot.action(/^sub_(.+)$/, async (ctx) => {
    const subjectId = ctx.match[1];
    const lectures = await sql`SELECT * FROM "Lecture" WHERE "subjectId" = ${subjectId} ORDER BY "order" ASC LIMIT 10`;
    
    if (lectures.length === 0) return ctx.answerCbQuery("No lectures found.");
    
    const buttons = lectures.map(l => [Markup.button.callback(`📖 ${l.title}`, `lec_${l.id}`)]);
    await ctx.editMessageText("📄 Choose a Lecture:", Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery();
  });

  bot.action(/^lec_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const lec = (await sql`SELECT * FROM "Lecture" WHERE "id" = ${lecId}`)[0];
    
    const buttons = [
      [Markup.button.callback("🎥 Videos", `vids_${lecId}`), Markup.button.callback("📁 Files", `files_${lecId}`)],
      [Markup.button.callback("📝 Quiz", `quiz_${lecId}`)],
      [Markup.button.callback("⬅️ Back to Subjects", "mod_back")] // Simplified back logic
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
    
    const storageId = env.TELEGRAM_STORAGE_GROUP_ID || "-1003146628517";
    
    for (const v of vids) {
      let msgId = v.telegramMessageId;
      
      if (!msgId) {
        // First time: Send to storage group ONLY
        try {
          const cacheMsg = await ctx.telegram.sendMessage(storageId, `🎥 *VIDEO CACHE*\n📝 ${v.title}\n🔗 ${v.url}`, { parse_mode: 'Markdown' });
          msgId = cacheMsg.message_id.toString();
          // Save to DB for next time
          await sql`UPDATE "LectureVideo" SET "telegramMessageId" = ${msgId}, "telegramChatId" = ${storageId} WHERE "id" = ${v.id}`;
          await delay(1000);
        } catch (e) {
          // Fallback if caching fails
          await ctx.reply(`🎥 *${v.title}*\n🔗 [Watch](${v.url})`, { parse_mode: 'Markdown' });
          continue;
        }
      }
      
      // Always Copy from storage
      try {
        await ctx.telegram.copyMessage(ctx.chat!.id, storageId, parseInt(msgId));
        await delay(1000);
      } catch (e) {}
    }
    await ctx.answerCbQuery();
  });

  bot.action(/^files_(.+)$/, async (ctx) => {
    const lecId = ctx.match[1];
    const files = await sql`SELECT * FROM "LectureFile" WHERE "lectureId" = ${lecId} LIMIT 5`;
    if (files.length === 0) return ctx.answerCbQuery("No files found.");
    
    const storageId = env.TELEGRAM_STORAGE_GROUP_ID || "-1003146628517";

    for (const f of files) {
      let msgId = f.telegramMessageId;

      if (!msgId) {
        try {
          const cacheMsg = await ctx.telegram.sendMessage(storageId, `📄 *FILE CACHE*\n📝 ${f.name}\n🔗 ${f.url}`, { parse_mode: 'Markdown' });
          msgId = cacheMsg.message_id.toString();
          await sql`UPDATE "LectureFile" SET "telegramMessageId" = ${msgId}, "telegramChatId" = ${storageId} WHERE "id" = ${f.id}`;
          await delay(1000);
        } catch (e) {
          await ctx.reply(`📄 *${f.name}*\n🔗 [Download](${f.url})`, { parse_mode: 'Markdown' });
          continue;
        }
      }
      
      try {
        await ctx.telegram.copyMessage(ctx.chat!.id, storageId, parseInt(msgId));
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
    
    const storageId = env.TELEGRAM_STORAGE_GROUP_ID || "-1003146628517";

    for (const q of questions) {
      try {
        await delay(2000); 

        // 🛡️ 1. Check Cache
        if (q.telegramMessageId) {
          try {
            await ctx.telegram.copyMessage(ctx.chat!.id, storageId, parseInt(q.telegramMessageId));
            continue;
          } catch (e) { }
        }

        // 🛡️ 2. Parse Choices (Supports both string array and object array)
        let choices = q.choices;
        if (typeof choices === 'string') choices = JSON.parse(choices);
        
        let options: string[] = [];
        let correctIdx = 0;

        if (Array.isArray(choices)) {
          // If it's an array of objects {key, text}
          if (choices[0] && typeof choices[0] === 'object' && 'text' in choices[0]) {
            options = choices.map((c: any) => c.text);
            const dbAnswer = q.answer.trim().toUpperCase();
            correctIdx = choices.findIndex((c: any) => c.key === dbAnswer || c.text === q.answer);
          } else {
            // Standard string array
            options = choices;
            correctIdx = options.findIndex(opt => opt === q.answer);
          }
        }

        if (options.length === 0) continue;
        if (correctIdx === -1) correctIdx = 0;

        // 🛡️ 3. Validate Content
        const safeBody = q.body.length > 250 ? q.body.substring(0, 250) + "..." : q.body;
        const safeOptions = options.map(opt => opt.length > 100 ? opt.substring(0, 97) + "..." : opt);
        const safeExpl = (q.explanation || q.aiExplanation || "").substring(0, 195);

        // 🛡️ 4. Send to Storage & Copy
        const cacheMsg = await ctx.telegram.sendPoll(storageId, safeBody, safeOptions, {
          type: 'quiz',
          correct_option_id: correctIdx,
          explanation: safeExpl,
          explanation_parse_mode: 'Markdown'
        } as any);

        await ctx.telegram.copyMessage(ctx.chat!.id, storageId, cacheMsg.message_id);

        // 🛡️ 5. Save to DB
        await sql`UPDATE "Question" SET "telegramMessageId" = ${cacheMsg.message_id.toString()}, "telegramChatId" = ${storageId} WHERE "id" = ${q.id}`;
        
      } catch (err) {
        console.error("Quiz Error:", err);
      }
    }
    await ctx.answerCbQuery();
  });

  // Simple AI Reply & Fallback
  bot.on('text', async (ctx) => {
    const user = await getLinkedUser(ctx.from.id.toString());
    if (!user) return ctx.reply("Please link your account first.");
    
    const text = ctx.message.text;
    if (text === "🧠 Ask Dr. Q") {
      return ctx.reply("🩺 *I am Dr. Q, your medical assistant.*\n\nHow can I help you today? Send me any medical question!", { parse_mode: 'Markdown' });
    }
    
    // Call Gemini directly via fetch
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ contents: [{ parts: [{ text: `You are Dr. Q, a professional medical tutor. User says: ${text}` }] }] })
      });
      const data: any = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to help with that.";
      await ctx.reply(reply, { parse_mode: 'Markdown' });
    } catch {
      await ctx.reply("Dr. Q is currently resting. 😴");
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
