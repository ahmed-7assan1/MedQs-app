
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { MEDICAL_TUTOR_SYSTEM_PREFIX } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
    ctx.reply(`Welcome to MedOneX! 🩺🌌\nPlease login to access your lectures.`, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login', 'auth_login')],
      [Markup.button.callback('📝 Register', 'auth_register')]
    ]));
  }
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
    if (itemAny.telegramMessageId && itemAny.telegramChatId) {
      try {
        await ctx.telegram.copyMessage(ctx.from!.id, itemAny.telegramChatId, itemAny.telegramMessageId);
      } catch {
        await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: 'Markdown' });
    }
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
    await ctx.reply(ai.text, { parse_mode: 'Markdown' });
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
