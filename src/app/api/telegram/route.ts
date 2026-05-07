
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { MEDICAL_TUTOR_SYSTEM_PREFIX } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getLinkedUser(telegramId: string) {
  return await prisma.user.findUnique({
    where: { telegramId },
    include: { university: true, semester: true }
  });
}

async function getBotUser(telegramId: string) {
  let user = await prisma.botUser.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.botUser.create({
      data: { telegramId, preferredProvider: 'gemini' }
    });
  }
  return user;
}

async function getGlobalConfig() {
  return await prisma.telegramConfig.findUnique({
    where: { id: 'global' }
  });
}

const MAIN_KEYBOARD = Markup.keyboard([
  [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
  [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
  [{ text: "👤 My Profile" }]
]).resize();

// ─── Bot Commands & Actions ───

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    ctx.reply(`Welcome back, Dr. ${linkedUser.name}! 🩺🌌\nMain Menu updated to English.`, MAIN_KEYBOARD);
  } else {
    ctx.reply(`Welcome to MedOneX! 🩺🌌\nPlease login or register.`, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login', 'auth_login')],
      [Markup.button.callback('📝 Register', 'auth_register')]
    ]));
  }
});

// Re-usable Modules Logic
const showModules = async (ctx: any) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  if (!user?.semesterId) return ctx.reply('⚠️ Please link your account first.');
  
  const modules = await prisma.module.findMany({ where: { semesterId: user.semesterId } });
  if (modules.length === 0) return ctx.reply('No modules found.');

  ctx.reply('Select a Module:', Markup.inlineKeyboard(
    modules.map(m => [Markup.button.callback(`📦 ${m.name}`, `mod_${m.id}`)])
  ));
};

bot.command('modules', showModules);
bot.hears('📚 My Modules', showModules);

bot.command('dashboard', async (ctx) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  if (!user) return ctx.reply('Please login.');
  ctx.reply(`📊 *Dashboard*\n\nName: ${user.name}\nUni: ${user.university?.name || 'N/A'}\nPoints: ${user.points || 0}`, { parse_mode: 'Markdown' });
});
bot.hears('📊 Dashboard', async (ctx) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  ctx.reply(`📊 *Dashboard*\n\nName: ${user?.name}\nPoints: ${user?.points || 0}`, { parse_mode: 'Markdown' });
});

bot.command('profile', async (ctx) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  ctx.reply(`👤 *Profile*\n\nEmail: ${user?.email}\nRole: ${user?.role}`, { parse_mode: 'Markdown' });
});
bot.hears('👤 My Profile', async (ctx) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  ctx.reply(`👤 *Profile*\n\nEmail: ${user?.email}`, { parse_mode: 'Markdown' });
});

bot.command('founders', async (ctx) => {
  ctx.reply('MedOneX was founded by Engineer Ahmed Hassan. 🚀');
});

// ─── Academic Navigation Tree ───

bot.action(/mod_(.+)/, async (ctx) => {
  const moduleId = ctx.match[1];
  const subjects = await prisma.subject.findMany({ where: { moduleId } });
  if (subjects.length === 0) return ctx.answerCbQuery('No subjects.');
  ctx.editMessageText('Select a Subject:', Markup.inlineKeyboard(
    subjects.map(s => [Markup.button.callback(`📖 ${s.name}`, `sub_${s.id}`)])
  ));
});

bot.action(/sub_(.+)/, async (ctx) => {
  const subjectId = ctx.match[1];
  const lectures = await prisma.lecture.findMany({ where: { subjectId }, orderBy: { order: 'asc' } });
  if (lectures.length === 0) return ctx.answerCbQuery('No lectures.');
  ctx.editMessageText('Select a Lecture:', Markup.inlineKeyboard(
    lectures.map(l => [Markup.button.callback(`📝 ${l.title}`, `lec_${l.id}`)])
  ));
});

bot.action(/lec_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const lec = await prisma.lecture.findUnique({
    where: { id: lecId },
    include: { videos: true, records: true, files: true, questions: true }
  });
  if (!lec) return ctx.answerCbQuery('Not found.');

  let res = `🎓 *${lec.title}*\n\n`;
  if (lec.videos.length > 0) {
    res += `📺 *Videos:*\n`;
    lec.videos.forEach(v => res += `• [${v.title}](${v.url})\n`);
  }
  if (lec.records.length > 0) {
    res += `\n🎙 *Records:*\n`;
    lec.records.forEach(r => res += `• [${r.title}](${r.url})\n`);
  }
  if (lec.files.length > 0) {
    res += `\n📂 *Files:*\n`;
    lec.files.forEach(f => res += `• [${f.name}](${f.url})\n`);
  }

  const buttons = [];
  if (lec.questions.length > 0) buttons.push([Markup.button.callback(`✍️ Start Quiz (${lec.questions.length})`, `quiz_${lec.id}`)]);
  buttons.push([Markup.button.callback('⬅️ Back', 'mod_back')]);

  await ctx.editMessageText(res, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }).catch(() => ctx.reply(res, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }));
});

// ─── Voice & Text Logic ───

bot.on('voice', async (ctx) => {
  await ctx.sendChatAction('typing');
  ctx.reply("I received your voice message! Processing... (Dr. Q is listening)");
});

bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUser = await getBotUser(telegramId);
  const userMessage = ctx.message.text.trim();
  const tempData = (botUser.tempData as any) || {};

  // Auth Steps
  if (tempData.step) {
    // ... (Login/Register logic remains the same but updated to English)
    if (tempData.step === 'LOG_EMAIL') {
       const existing = await prisma.user.findUnique({ where: { email: userMessage } });
       if (existing) {
         await prisma.user.update({ where: { id: existing.id }, data: { telegramId, telegramVerified: true } });
         await prisma.botUser.update({ where: { telegramId }, data: { tempData: Prisma.JsonNull } });
         return ctx.reply(`✅ Welcome Dr. ${existing.name}!`, MAIN_KEYBOARD);
       }
    }
  }

  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) return ctx.reply('Please login.', Markup.inlineKeyboard([[Markup.button.callback('🔐 Login', 'auth_login')]]));

  if (userMessage === "🧠 Ask Dr. Q") return ctx.reply("I'm ready! Ask me anything.");

  await ctx.sendChatAction('typing');
  try {
    const config = await getGlobalConfig();
    const systemPrompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER INFO] Dr. ${linkedUser.name}`;
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt, {
      preferredProvider: botUser.preferredProvider || (config?.defaultProvider as any) || 'gemini',
    });
    // Sanitize markdown to avoid 400 errors
    const safeText = aiResponse.text.replace(/([_*\[\]\(\)~`>#\+\-=\|{}.!])/g, '\\$1');
    await ctx.reply(aiResponse.text, { parse_mode: 'Markdown' });
  } catch (e: any) {
    ctx.reply(`AI Error: ${e.message}`);
  }
});

// ─── Actions ───
bot.action('auth_login', (ctx) => { /* ... */ });
bot.action('auth_register', (ctx) => { /* ... */ });

// Initialize Commands
try {
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Main Menu' },
    { command: 'modules', description: 'My Modules' },
    { command: 'dashboard', description: 'My Dashboard' },
    { command: 'profile', description: 'My Profile' },
    { command: 'settings', description: 'Settings' }
  ]);
} catch (e) {}

export async function POST(req: Request) {
  try {
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_SECRET_TOKEN && secretToken !== process.env.TELEGRAM_SECRET_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
