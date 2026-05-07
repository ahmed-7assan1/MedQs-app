
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

// ─── Bot Logic (English UI) ───

bot.start(async (ctx) => {
  const config = await getGlobalConfig();
  if (config?.botStatus === 'MAINTENANCE') {
    return ctx.reply('⚠️ Maintenance Mode: We will be back soon! 🩺');
  }

  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    ctx.reply(`Welcome back, Dr. ${linkedUser.name}! 🩺🌌\nHow can I assist you today?`, {
      reply_markup: {
        keyboard: [
          [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
          [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
          [{ text: "👤 My Profile" }]
        ],
        resize_keyboard: true
      }
    });
  } else {
    ctx.reply(`Welcome to MedOneX AI Assistant! 🩺🌌\n\nPlease log in or create a new account to access your medical lectures and AI features.`, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login', 'auth_login')],
      [Markup.button.callback('📝 Register', 'auth_register')]
    ]));
  }
});

// ─── Auth Flow (English) ───

bot.action('auth_register', async (ctx) => {
  await prisma.botUser.upsert({
    where: { telegramId: ctx.from!.id.toString() },
    update: { tempData: { step: 'REG_NAME' } },
    create: { telegramId: ctx.from!.id.toString(), tempData: { step: 'REG_NAME' } }
  });
  ctx.editMessageText('Excellent! Let\'s create your account. What is your full name?');
});

bot.action('auth_login', async (ctx) => {
  await prisma.botUser.upsert({
    where: { telegramId: ctx.from!.id.toString() },
    update: { tempData: { step: 'LOG_EMAIL' } },
    create: { telegramId: ctx.from!.id.toString(), tempData: { step: 'LOG_EMAIL' } }
  });
  ctx.editMessageText('Please send your registered email address:');
});

// ─── Modules & Academic Navigation ───

bot.hears('📚 My Modules', async (ctx) => {
  const user = await getLinkedUser(ctx.from.id.toString());
  if (!user?.semesterId) return ctx.reply('⚠️ Please link your account first.');
  
  const modules = await prisma.module.findMany({
    where: { semesterId: user.semesterId }
  });

  if (modules.length === 0) return ctx.reply('No modules found for your current semester.');

  ctx.reply('Select a Module:', Markup.inlineKeyboard(
    modules.map(m => [Markup.button.callback(`📦 ${m.name}`, `mod_${m.id}`)])
  ));
});

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
  const lectures = await prisma.lecture.findMany({ 
    where: { subjectId },
    orderBy: { order: 'asc' }
  });
  
  if (lectures.length === 0) return ctx.answerCbQuery('No lectures found.');

  ctx.editMessageText('Select a Lecture:', Markup.inlineKeyboard(
    lectures.map(l => [Markup.button.callback(`📝 ${l.title}`, `lec_${l.id}`)])
  ));
});

bot.action(/lec_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const lec = await prisma.lecture.findUnique({
    where: { id: lecId },
    include: { videos: true, records: true, files: true, notes: true, questions: true }
  });

  if (!lec) return ctx.answerCbQuery('Lecture not found.');

  let response = `🎓 *${lec.title}*\n\n`;
  
  if (lec.videos.length > 0) {
    response += `📺 *Videos:*\n`;
    lec.videos.forEach(v => response += `• [${v.title}](${v.url})\n`);
    response += `\n`;
  }

  if (lec.records.length > 0) {
    response += `🎙 *Records:*\n`;
    lec.records.forEach(r => response += `• [${r.title}](${r.url})\n`);
    response += `\n`;
  }

  if (lec.files.length > 0) {
    response += `📂 *Files:*\n`;
    lec.files.forEach(f => response += `• [${f.name}](${f.url})\n`);
    response += `\n`;
  }

  if (lec.notes.length > 0) {
    response += `📝 *My Notes:*\n`;
    lec.notes.forEach(n => response += `[View Note Content] - _(Sent separately if requested)_ \n`);
  }

  const buttons = [];
  if (lec.questions.length > 0) buttons.push([Markup.button.callback(`✍️ Start Quiz (${lec.questions.length})`, `quiz_${lec.id}`)]);
  buttons.push([Markup.button.callback('⬅️ Back to Subjects', `mod_back`)]);

  await ctx.editMessageText(response, { 
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons)
  });
});

// ─── Telegram Quizzes (Poll Mode) ───

bot.action(/quiz_(.+)/, async (ctx) => {
  const lecId = ctx.match[1];
  const questions = await prisma.question.findMany({ where: { lectureId: lecId } });

  if (questions.length === 0) return ctx.answerCbQuery('No questions available.');

  for (const q of questions) {
    const choices = q.choices as string[];
    const correctIndex = choices.indexOf(q.answer);

    await ctx.replyWithQuiz(q.body, choices, {
      correct_option_id: correctIndex >= 0 ? correctIndex : 0,
      explanation: q.explanation || 'No explanation provided.',
      explanation_parse_mode: 'Markdown'
    });
  }
});

// ─── Voice Interaction ───

bot.on('voice', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) return ctx.reply('Please login to use Dr. Q Voice features.');

  await ctx.sendChatAction('typing');
  
  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    
    // Using AI to process voice (Multimodal)
    const prompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER: ${linkedUser.name}] The user sent a voice message. Please listen to it (transcribed or processed) and respond.`;
    
    // For now, we inform the user we are listening. 
    // In a full implementation, we'd fetch the file and send to Gemini.
    const aiResponse = await generateAIReplyWithFallback(`[Voice Message Attached: ${fileLink.href}]`, prompt, {
      preferredProvider: 'gemini'
    });

    await ctx.reply(`🎙 *Dr. Q Voice Response:*\n\n${aiResponse.text}`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('Sorry, I had trouble processing your voice message.');
  }
});

// ─── Text & Auth Logic ───

bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUser = await getBotUser(telegramId);
  const userMessage = ctx.message.text.trim();
  const tempData = (botUser.tempData as any) || {};

  if (tempData.step) {
    switch (tempData.step) {
      case 'LOG_EMAIL':
        const existing = await prisma.user.findUnique({ where: { email: userMessage } });
        if (existing) {
          await prisma.user.update({ where: { id: existing.id }, data: { telegramId, telegramVerified: true } });
          await prisma.botUser.update({ where: { telegramId }, data: { tempData: Prisma.JsonNull } });
          return ctx.reply(`✅ Welcome, Dr. ${existing.name}! Login successful.`, Markup.keyboard([
            [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
            [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
            [{ text: "👤 My Profile" }]
          ]).resize());
        }
        return ctx.reply('❌ Email not found. Try again or press /start.');

      case 'REG_NAME':
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_EMAIL', name: userMessage } } });
        return ctx.reply(`Hello Dr. ${userMessage}! Now send your email:`);

      case 'REG_EMAIL':
        const check = await prisma.user.findUnique({ where: { email: userMessage } });
        if (check) return ctx.reply('❌ Email already registered. Try another:');
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_PASS', email: userMessage } } });
        return ctx.reply('Choose a password (min 6 characters):');

      case 'REG_PASS':
        if (userMessage.length < 6) return ctx.reply('⚠️ Too short, choose another:');
        const hashed = await bcrypt.hash(userMessage, 10);
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_UNI', password: hashed } } });
        const unis = await prisma.university.findMany({ select: { id: true, name: true }, take: 8 });
        return ctx.reply('Select your University:', Markup.inlineKeyboard(unis.map(u => [Markup.button.callback(u.name, `reg_uni_${u.id}`)])));
    }
  }

  // AI Response Flow (English)
  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) {
    if (userMessage.startsWith('/')) return; // Let commands handle themselves
    return ctx.reply('Please login to chat with Dr. Q.', Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Login', 'auth_login')],
      [Markup.button.callback('📝 Register', 'auth_register')]
    ]));
  }

  if (userMessage === "🧠 Ask Dr. Q") return ctx.reply("I'm listening! Ask me any medical question.");
  if (userMessage === "📊 Dashboard") return ctx.reply(`📊 *Dashboard*\n\nName: ${linkedUser.name}\nUni: ${linkedUser.university?.name}\nPoints: ${linkedUser.points || 0}`, { parse_mode: 'Markdown' });

  await ctx.sendChatAction('typing');
  try {
    const config = await getGlobalConfig();
    const systemPrompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER INFO] Dr. ${linkedUser.name} from ${linkedUser.university?.name}. Current Semester: ${linkedUser.semester?.name}`;
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt, {
      preferredProvider: botUser.preferredProvider || (config?.defaultProvider as any) || 'gemini',
      personalKey: botUser.personalKey || undefined,
      useCustomKey: !!botUser.personalKey
    });
    await ctx.reply(aiResponse.text, { parse_mode: 'Markdown' });
  } catch (e: any) {
    ctx.reply(`Error: ${e.message}`);
  }
});

// ─── University Selection Handlers ───

bot.action(/reg_uni_(.+)/, async (ctx) => {
  const uniId = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_FAC', universityId: uniId } } });
  const faculties = await prisma.faculty.findMany({ where: { universityId: uniId }, select: { id: true, name: true } });
  ctx.editMessageText('Select your Faculty:', Markup.inlineKeyboard(faculties.map(f => [Markup.button.callback(f.name, `reg_fac_${f.id}`)])));
});

bot.action(/reg_fac_(.+)/, async (ctx) => {
  const facId = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_SEM', facultyId: facId } } });
  const semesters = await prisma.semester.findMany({ 
    where: { academicYear: { facultyId: facId } }, 
    select: { id: true, name: true } 
  });
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
  ctx.editMessageText(`🎉 Congratulations Dr. ${newUser.name}! Your account is ready.`, Markup.keyboard([
    [{ text: "🧠 Ask Dr. Q" }, { text: "📚 My Modules" }],
    [{ text: "📊 Dashboard" }, { text: "⚙️ Settings" }],
    [{ text: "👤 My Profile" }]
  ]).resize());
});

// ─── Finalize Menu & Commands ───

try {
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Main Menu' },
    { command: 'modules', description: 'Browse My Modules' },
    { command: 'dashboard', description: 'View My Stats' },
    { command: 'settings', description: 'AI Engine Settings' },
    { command: 'founders', description: 'Founders of MedOneX' },
    { command: 'profile', description: 'My Account' }
  ]);
} catch (e) {}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
