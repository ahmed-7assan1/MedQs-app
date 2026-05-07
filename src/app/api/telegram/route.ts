
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { MEDICAL_TUTOR_SYSTEM_PREFIX } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getLinkedUser(telegramId: string) {
  return await (prisma.user as any).findFirst({
    where: { telegramId: telegramId.toString() },
    include: { university: true, semester: true }
  });
}

async function getBotUser(telegramId: string) {
  let user = await (prisma as any).botUser.findUnique({ where: { telegramId: telegramId.toString() } });
  if (!user) {
    user = await (prisma as any).botUser.create({
      data: { telegramId: telegramId.toString(), preferredProvider: 'gemini' }
    });
  }
  return user;
}

async function getGlobalConfig() {
  return await (prisma as any).telegramConfig.findUnique({
    where: { id: 'global' }
  });
}

const MAIN_KEYBOARD = Markup.keyboard([
  [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
  [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
  [{ text: "👤 My Profile" }]
]).resize();

// ─── Bot Logic ───

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    ctx.reply(`Welcome back, Dr. ${linkedUser.name}! 🩺🌌\nHow can I help you today?`, MAIN_KEYBOARD);
  } else {
    ctx.reply(`Welcome to MedOneX! 🩺🌌\nPlease login to access your lectures and start learning.`, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login with Web Code', 'auth_login')],
      [Markup.button.callback('📝 Quick Register', 'auth_register')]
    ]));
  }
});

// ─── Authentication Handlers ───

bot.action('auth_login', async (ctx) => {
  const telegramId = ctx.from!.id.toString();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await (prisma as any).botAuth.upsert({
    where: { telegramId },
    update: { code, expiresAt },
    create: { telegramId, code, expiresAt }
  });

  await ctx.editMessageText(
    `🔑 Your Login Code: \`${code}\`\n\n` +
    `1. Go to the MedOneX Dashboard.\n` +
    `2. Open your Profile Settings.\n` +
    `3. Click 'Link Telegram' and enter this code.\n\n` +
    `_This code expires in 10 minutes._`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('auth_register', async (ctx) => {
  const telegramId = ctx.from!.id.toString();
  await (prisma as any).botUser.update({
    where: { telegramId },
    data: { tempData: { step: 'awaiting_name' } }
  });
  await ctx.editMessageText('📝 Let\'s get you started! What is your full name?');
});

// ─── Academic Navigation ───

const showModules = async (ctx: any) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  if (!user?.semesterId) return ctx.reply('⚠️ Please link your account first.');
  
  const modules = await (prisma.module as any).findMany({ where: { semesterId: user.semesterId } });
  if (modules.length === 0) return ctx.reply('No modules found for your semester.');

  ctx.reply('Select a Module:', Markup.inlineKeyboard(
    modules.map((m: any) => [Markup.button.callback(`📦 ${m.name}`, `mod_${m.id}`)])
  ));
};

bot.command('modules', showModules);
bot.hears('📚 My Modules', showModules);

bot.action(/mod_(.+)/, async (ctx) => {
  const moduleId = ctx.match[1];
  const subjects = await (prisma.subject as any).findMany({ where: { moduleId } });
  if (subjects.length === 0) return ctx.answerCbQuery('No subjects in this module.');
  ctx.editMessageText('Select a Subject:', Markup.inlineKeyboard(
    subjects.map((s: any) => [Markup.button.callback(`📖 ${s.name}`, `sub_${s.id}`)])
  ));
});

bot.action(/sub_(.+)/, async (ctx) => {
  const subjectId = ctx.match[1];
  const lectures = await (prisma.lecture as any).findMany({ where: { subjectId }, orderBy: { order: 'asc' } });
  if (lectures.length === 0) return ctx.answerCbQuery('No lectures found.');
  ctx.editMessageText('Select a Lecture:', Markup.inlineKeyboard(
    lectures.map((l: any) => [Markup.button.callback(`📝 ${l.title}`, `lec_${l.id}`)])
  ));
});

bot.action(/lec_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const lec = await (prisma.lecture as any).findUnique({
    where: { id: lecId },
    include: { videos: true, records: true, files: true, questions: true }
  });
  if (!lec) return ctx.answerCbQuery('Lecture not found.');

  await ctx.answerCbQuery();
  
  let msg = `🎓 *${lec.title}*\n\n`;
  const attachments = [...lec.files, ...lec.videos, ...lec.records];
  
  if (attachments.length === 0) {
    msg += "_No files available yet._";
  } else {
    msg += `📦 *Lecture Content (${attachments.length} items):*\n`;
    for (const item of attachments) {
      const title = (item as any).name || (item as any).title;
      msg += `• ${title}\n`;
    }
  }

  const buttons: any[][] = [];
  if (attachments.length > 0) buttons.push([Markup.button.callback('📥 Get All Files', `get_all_${lec.id}`)]);
  if (lec.questions.length > 0) buttons.push([Markup.button.callback(`✍️ Start Quiz (${lec.questions.length})`, `quiz_${lec.id}`)]);
  buttons.push([Markup.button.callback('⬅️ Back', `sub_${lec.subjectId}`)]);

  await ctx.reply(msg, { 
    parse_mode: 'Markdown', 
    ...Markup.inlineKeyboard(buttons) 
  });
});

bot.action(/get_all_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const lec = await (prisma.lecture as any).findUnique({
    where: { id: lecId },
    include: { videos: true, records: true, files: true }
  });
  if (!lec) return ctx.answerCbQuery();
  
  await ctx.answerCbQuery('Delivering files... 🚀');
  const all = [...lec.files, ...lec.videos, ...lec.records];
  
  for (const item of all) {
    const itemAny = item as any;
    let sentMessage: any = null;
    
    if (itemAny.telegramMessageId && itemAny.telegramChatId) {
      try {
        sentMessage = await ctx.telegram.copyMessage(ctx.from!.id, itemAny.telegramChatId, itemAny.telegramMessageId);
      } catch {
        sentMessage = await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: 'Markdown' });
      }
    } else {
      sentMessage = await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: 'Markdown' });
    }

    // Forward to data group if configured and not already there
    if (STORAGE_GROUP_ID && sentMessage && !itemAny.telegramChatId) {
      try {
        const forwarded = await ctx.telegram.forwardMessage(STORAGE_GROUP_ID, ctx.from!.id, sentMessage.message_id);
        // Save the IDs for next time to reduce DB/Link load
        const modelName = (itemAny.url.includes('video') || itemAny.title) ? 'lectureVideo' : 'lectureFile';
        await (prisma as any)[modelName].update({
          where: { id: itemAny.id },
          data: { telegramChatId: STORAGE_GROUP_ID.toString(), telegramMessageId: forwarded.message_id }
        }).catch(() => {});
      } catch (err) {
        console.error("Storage Group Forward Error:", err);
      }
    }
  }
});

// ─── Quiz System ───

bot.action(/quiz_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const questions = await (prisma.question as any).findMany({
    where: { lectureId: lecId },
    orderBy: { createdAt: 'asc' }
  });

  if (questions.length === 0) return ctx.answerCbQuery('No questions for this lecture.');

  await ctx.answerCbQuery();
  
  // Store session in BotUser tempData
  await (prisma as any).botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { 
      tempData: { 
        type: 'quiz', 
        lecId, 
        qIdx: 0, 
        score: 0,
        qIds: questions.map((q: any) => q.id)
      } 
    }
  });

  return sendQuizQuestion(ctx, questions[0], 0, questions.length);
});

async function sendQuizQuestion(ctx: any, q: any, idx: number, total: number) {
  const choices = q.choices as string[];
  const buttons = choices.map((choice, i) => [
    Markup.button.callback(choice, `ans_${i}`)
  ]);

  const msg = `❓ *Question ${idx + 1}/${total}*\n\n${q.body}`;
  
  if (ctx.updateType === 'callback_query') {
    await ctx.editMessageText(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } else {
    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  }
}

bot.action(/ans_(.+)/, async (ctx) => {
  const choiceIdx = parseInt(ctx.match[1]);
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const quiz = botUser.tempData;

  if (!quiz || quiz.type !== 'quiz') return ctx.answerCbQuery();

  const qId = quiz.qIds[quiz.qIdx];
  const q = await (prisma.question as any).findUnique({ where: { id: qId } });
  if (!q) return ctx.answerCbQuery();

  const isCorrect = q.choices[choiceIdx] === q.answer;
  const newScore = isCorrect ? quiz.score + 1 : quiz.score;
  const nextIdx = quiz.qIdx + 1;

  if (isCorrect) {
    await ctx.answerCbQuery('✅ Correct!');
  } else {
    await ctx.answerCbQuery(`❌ Wrong! Correct: ${q.answer}`);
  }

  if (nextIdx < quiz.qIds.length) {
    const nextQId = quiz.qIds[nextIdx];
    const nextQ = await (prisma.question as any).findUnique({ where: { id: nextQId } });
    
    await (prisma as any).botUser.update({
      where: { telegramId },
      data: { tempData: { ...quiz, qIdx: nextIdx, score: newScore } }
    });

    return sendQuizQuestion(ctx, nextQ, nextIdx, quiz.qIds.length);
  } else {
    await (prisma as any).botUser.update({
      where: { telegramId },
      data: { tempData: null }
    });
    return ctx.editMessageText(
      `🏁 *Quiz Finished!*\n\nYour Score: *${newScore}/${quiz.qIds.length}*\nPoints earned: *${newScore * 5}*`,
      { parse_mode: 'Markdown' }
    );
  }
});

// ─── Settings (Provider Selection) ───

bot.action('set_provider_menu', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.editMessageText('🧠 *Choose AI Provider:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🌐 Google Gemini', 'set_prov_gemini')],
      [Markup.button.callback('⚡ Groq (Llama 3)', 'set_prov_groq')],
      [Markup.button.callback('🔗 OpenRouter', 'set_prov_openrouter')],
      [Markup.button.callback('⬅️ Back', 'settings')]
    ])
  });
});

bot.action(/set_prov_(.+)/, async (ctx) => {
  const prov = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  await (prisma as any).botUser.update({ where: { telegramId }, data: { preferredProvider: prov } });
  ctx.editMessageText(`✅ Provider set to *${prov.toUpperCase()}*.\n\nWould you like to set a personal API key for this provider?`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Set API Key', `ask_key_${prov}`)],
      [Markup.button.callback('⬅️ Done', 'settings')]
    ])
  });
});

bot.action(/ask_key_(.+)/, async (ctx) => {
  const prov = ctx.match[1];
  await (prisma as any).botUser.update({ 
    where: { telegramId: ctx.from!.id.toString() }, 
    data: { waitingForKeyProvider: prov } 
  });
  ctx.editMessageText(`Please send your API key for *${prov.toUpperCase()}*:`, { parse_mode: 'Markdown' });
});

bot.hears('⚙️ Settings', async (ctx) => {
  const bUser = await getBotUser(ctx.from.id.toString());
  const msg = `⚙️ *Settings*\n\nAI Provider: *${bUser.preferredProvider?.toUpperCase()}*\nKey: ${bUser.personalKey ? '✅ Saved' : '❌ Using Shared'}`;
  ctx.reply(msg, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🤖 Change Provider', 'set_provider_menu')],
      [Markup.button.callback('🗑️ Clear My Key', 'clear_personal_key')]
    ])
  });
});

bot.action('clear_personal_key', async (ctx) => {
  await (prisma as any).botUser.update({ where: { telegramId: ctx.from!.id.toString() }, data: { personalKey: null } });
  ctx.answerCbQuery('Key cleared! ✅');
});

// ─── Group Logic ───

bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUser = await getBotUser(telegramId);
  const text = ctx.message.text;

  // 🤫 Group Silence Mode
  if (ctx.chat.type !== 'private') {
    const isMentioned = text.includes(`@${ctx.botInfo.username}`);
    const isMedonex = text.toLowerCase().startsWith('medonex');
    if (!isMentioned && !isMedonex) return; // Ignore if not summoned
  }

  // Handle multi-step tempData flows
  if (botUser.tempData) {
    const step = botUser.tempData.step;
    
    if (step === 'awaiting_name') {
      await (prisma as any).botUser.update({
        where: { telegramId },
        data: { tempData: { step: 'awaiting_email', name: text.trim() } }
      });
      return ctx.reply(`Hi ${text.trim()}! Now, please send your university email:`);
    }

    if (step === 'awaiting_email') {
      const name = botUser.tempData.name;
      await (prisma as any).botUser.update({
        where: { telegramId },
        data: { tempData: null }
      });
      // In a real app, we'd create the user here or send a confirmation link.
      // For now, we'll guide them to the web with their info pre-filled (simulated).
      return ctx.reply(
        `✅ Information received, ${name}!\n\n` +
        `To complete registration, please use this link:\n` +
        `[Register on MedOneX](https://medonex.com/auth/register?email=${encodeURIComponent(text.trim())}&name=${encodeURIComponent(name)})`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // Handle waiting for key
  if (botUser.waitingForKeyProvider) {
    await (prisma as any).botUser.update({
      where: { telegramId },
      data: { personalKey: text.trim(), waitingForKeyProvider: null }
    });
    return ctx.reply(`✅ API Key saved for ${botUser.waitingForKeyProvider.toUpperCase()}!`, MAIN_KEYBOARD);
  }

  // Standard AI Chat
  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) return ctx.reply('Please login to chat. /start');

  if (text === "🧠 Ask Dr. Q") return ctx.reply("I'm listening! Ask me anything.");
  if (text === "📊 Dashboard") {
    const dash = await getLinkedUser(telegramId);
    return ctx.reply(`📊 *Dashboard*\n\nName: ${dash?.name}\nPoints: ${dash?.points || 0}`, { parse_mode: 'Markdown' });
  }

  try {
    const config = await getGlobalConfig();
    const sys = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER: Dr. ${linkedUser.name}]`;
    
    // Pass personal keys if available
    const ai = await generateAIReplyWithFallback(text, sys, {
      preferredProvider: botUser.preferredProvider || (config?.defaultProvider as any) || 'gemini',
      personalKey: botUser.personalKey || undefined,
      useCustomKey: !!botUser.personalKey,
      customProvider: (botUser.preferredProvider as any) || 'gemini'
    });

    const replyMessage = await ctx.reply(ai.text, { parse_mode: 'Markdown' });

    // Forward AI response to data group for searchable archive
    if (STORAGE_GROUP_ID && replyMessage) {
      try {
        await ctx.telegram.forwardMessage(STORAGE_GROUP_ID, ctx.from!.id, replyMessage.message_id);
      } catch (err) {
        console.error("AI Storage Forward Error:", err);
      }
    }
  } catch (error: any) {
    console.error("Bot AI Error:", error);
    ctx.reply('🩺 Dr. Q is currently resting. Try again in a bit.');
  }
});

// Webhook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
