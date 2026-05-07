
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
  return await prisma.user.findFirst({
    where: { telegramId: telegramId },
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

// ─── Bot Logic ───

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    ctx.reply(`Welcome back, Dr. ${linkedUser.name}! 🩺🌌\nHow can I help you today?`, MAIN_KEYBOARD);
  } else {
    ctx.reply(`Welcome to MedOneX! 🩺🌌\nPlease login to access your lectures or register a new account.`, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login', 'auth_login')],
      [Markup.button.callback('📝 Register', 'auth_register')]
    ]));
  }
});

// ─── Authentication Flow ───

bot.action('auth_login', async (ctx) => {
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { tempData: { step: 'LOG_EMAIL' } }
  });
  ctx.editMessageText('Please send your registered email address:');
});

bot.action('auth_register', async (ctx) => {
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { tempData: { step: 'REG_NAME' } }
  });
  ctx.editMessageText('Excellent! What is your full name?');
});

// ─── Academic Navigation ───

const showModules = async (ctx: any) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  if (!user?.semesterId) return ctx.reply('⚠️ Please link your account first.');
  
  const modules = await prisma.module.findMany({ where: { semesterId: user.semesterId } });
  if (modules.length === 0) return ctx.reply('No modules found for your semester.');

  ctx.reply('Select a Module:', Markup.inlineKeyboard(
    modules.map(m => [Markup.button.callback(`📦 ${m.name}`, `mod_${m.id}`)])
  ));
};

bot.command('modules', showModules);
bot.hears('📚 My Modules', showModules);

bot.action(/mod_(.+)/, async (ctx) => {
  const moduleId = ctx.match[1];
  const subjects = await prisma.subject.findMany({ where: { moduleId } });
  if (subjects.length === 0) return ctx.answerCbQuery('No subjects in this module.');
  ctx.editMessageText('Select a Subject:', Markup.inlineKeyboard(
    subjects.map(s => [Markup.button.callback(`📖 ${s.name}`, `sub_${s.id}`)])
  ));
});

bot.action(/sub_(.+)/, async (ctx) => {
  const subjectId = ctx.match[1];
  const lectures = await prisma.lecture.findMany({ where: { subjectId }, orderBy: { order: 'asc' } });
  if (lectures.length === 0) return ctx.answerCbQuery('No lectures found.');
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
  if (!lec) return ctx.answerCbQuery('Lecture not found.');

  let res = `🎓 *${lec.title}*\n\n`;
  if (lec.records.length > 0) {
    res += `🎙 *Records:*\n`;
    lec.records.forEach(r => res += `• [${r.title}](${r.url})\n`);
  }
  if (lec.files.length > 0) {
    res += `\n📂 *Files:*\n`;
    lec.files.forEach(f => res += `• [${f.name}](${f.url})\n`);
  }
  if (lec.videos.length > 0) {
    res += `\n📺 *Videos:*\n`;
    lec.videos.forEach(v => res += `• [${v.title}](${v.url})\n`);
  }

  const buttons: ReturnType<typeof Markup.button.callback>[][] = [];
  if (lec.questions.length > 0) buttons.push([Markup.button.callback(`✍️ Start Quiz (${lec.questions.length})`, `quiz_${lec.id}`)]);
  buttons.push([Markup.button.callback('⬅️ Back', `mod_back`)]);

  await ctx.editMessageText(res, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }).catch(() => ctx.reply(res, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }));
});

// ─── Telegram Quiz System (Poll Mode) ───

bot.action(/quiz_(.+)/, async (ctx) => {
  // ✅ Acknowledge IMMEDIATELY to prevent Telegram from retrying the callback
  await ctx.answerCbQuery('Quiz started! 🎯');
  
  const lecId = ctx.match[1];
  const questions = await prisma.question.findMany({ where: { lectureId: lecId } });
  if (questions.length === 0) return;

  await ctx.reply(`📝 *Starting Quiz — ${questions.length} questions*\nAnswer each question, then use the 💡 explanation to learn more!`, { parse_mode: 'Markdown' });
  
  for (const q of questions) {
    const choices = q.choices as string[];
    const correctIndex = choices.indexOf(q.answer);
    
    // Store question body in BotUser tempData so poll_answer can reference it
    await ctx.replyWithQuiz(q.body, choices, {
      correct_option_id: correctIndex >= 0 ? correctIndex : 0,
      explanation: (q.explanation || 'No explanation provided.').substring(0, 200),
      is_anonymous: false  // Non-anonymous so we get poll_answer events
    });

    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
});

// ─── Poll Answer Handler (AI Interaction on Quiz Answers) ───

bot.on('poll_answer', async (ctx) => {
  const telegramId = ctx.pollAnswer.user.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) return;

  const optionIds = ctx.pollAnswer.option_ids;
  if (optionIds.length === 0) return; // User retracted answer

  try {
    await ctx.telegram.sendChatAction(telegramId, 'typing');
    
    const botUser = await getBotUser(telegramId);
    const config = await getGlobalConfig();
    
    const systemPrompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER: Dr. ${linkedUser.name}] The student just answered a quiz question. Provide a SHORT (2-3 sentences) educational tip or follow-up question to deepen their understanding on this topic. Be encouraging.`;
    
    const prompt = `The student answered a medical quiz question. Selected option index: ${optionIds[0]}. Please give a quick educational insight or ask a follow-up question to help them learn more about this topic.`;
    
    const aiResponse = await generateAIReplyWithFallback(prompt, systemPrompt, {
      preferredProvider: botUser.preferredProvider || (config?.defaultProvider as any) || 'gemini',
    });

    await ctx.telegram.sendMessage(telegramId, `🧠 *Dr. Q:*\n\n${aiResponse.text}`, { parse_mode: 'Markdown' });
  } catch (e) {
    // Silent fail — don't interrupt quiz flow
    console.error('poll_answer AI error:', e);
  }
});

// ─── Handlers for Registration Selections ───

bot.action(/reg_uni_(.+)/, async (ctx) => {
  const uniId = ctx.match[1];
  const botUser = await getBotUser(ctx.from!.id.toString());
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId: ctx.from!.id.toString() }, data: { tempData: { ...tempData, step: 'REG_FAC', universityId: uniId } } });
  const faculties = await prisma.faculty.findMany({ where: { universityId: uniId } });
  ctx.editMessageText('Select your Faculty:', Markup.inlineKeyboard(faculties.map(f => [Markup.button.callback(f.name, `reg_fac_${f.id}`)])));
});

bot.action(/reg_fac_(.+)/, async (ctx) => {
  const facId = ctx.match[1];
  const botUser = await getBotUser(ctx.from!.id.toString());
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId: ctx.from!.id.toString() }, data: { tempData: { ...tempData, step: 'REG_SEM', facultyId: facId } } });
  const semesters = await prisma.semester.findMany({ where: { academicYear: { facultyId: facId } } });
  ctx.editMessageText('Select your Semester:', Markup.inlineKeyboard(semesters.map(s => [Markup.button.callback(s.name, `reg_sem_${s.id}`)])));
});

bot.action(/reg_sem_(.+)/, async (ctx) => {
  const semId = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const tempData = (botUser.tempData as any) || {};
  
  const newUser = await prisma.user.create({
    data: {
      name: tempData.name, email: tempData.email, password: tempData.password,
      universityId: tempData.universityId, facultyId: tempData.facultyId, semesterId: semId,
      telegramId, telegramVerified: true, role: 'STUDENT'
    }
  });
  
  await prisma.botUser.update({ where: { telegramId }, data: { tempData: Prisma.JsonNull } });
  await ctx.reply(`🎊 CONGRATULATIONS DR. ${newUser.name}! 🎊\nAccount linked successfully.`, MAIN_KEYBOARD);
});

// ─── Text & AI Logic ───

bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUser = await getBotUser(telegramId);
  const userMessage = ctx.message.text.trim();
  const tempData = (botUser.tempData as any) || {};

  if (tempData.step) {
    if (tempData.step === 'LOG_EMAIL') {
      const existing = await prisma.user.findUnique({ where: { email: userMessage } });
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data: { telegramId, telegramVerified: true } });
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: Prisma.JsonNull } });
        return ctx.reply(`✅ Welcome, Dr. ${existing.name}! Login successful.`, MAIN_KEYBOARD);
      }
      return ctx.reply('❌ Email not found. Try again or /start.');
    }
    // Handle Registration steps (Name, Email, Pass)
    if (tempData.step === 'REG_NAME') {
      await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_EMAIL', name: userMessage } } });
      return ctx.reply('Please send your email:');
    }
    if (tempData.step === 'REG_EMAIL') {
      await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_PASS', email: userMessage } } });
      return ctx.reply('Choose a password:');
    }
    if (tempData.step === 'REG_PASS') {
      const hashed = await bcrypt.hash(userMessage, 10);
      await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_UNI', password: hashed } } });
      const unis = await prisma.university.findMany({ take: 8 });
      return ctx.reply('Select University:', Markup.inlineKeyboard(unis.map(u => [Markup.button.callback(u.name, `reg_uni_${u.id}`)])));
    }
  }

  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) return ctx.reply('Please login to continue.');

  if (userMessage === "🧠 Ask Dr. Q") return ctx.reply("I'm listening! Ask me any medical question.");
  if (userMessage === "📊 Dashboard") return ctx.reply(`📊 *Dashboard*\n\nName: ${linkedUser.name}\nUni: ${linkedUser.university?.name || 'N/A'}\nPoints: ${linkedUser.points || 0}`, { parse_mode: 'Markdown' });

  await ctx.sendChatAction('typing');
  try {
    const config = await getGlobalConfig();
    const systemPrompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER: Dr. ${linkedUser.name}]`;
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt, {
      preferredProvider: botUser.preferredProvider || (config?.defaultProvider as any) || 'gemini',
    });
    await ctx.reply(aiResponse.text, { parse_mode: 'Markdown' });
  } catch (e: any) {
    ctx.reply(`AI Error: ${e.message}`);
  }
});

// Webhook Handler
export async function POST(req: Request) {
  try {
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_SECRET_TOKEN && secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
