
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

// ─── Bot Logic ───

bot.start(async (ctx) => {
  const config = await getGlobalConfig();
  if (config?.botStatus === 'MAINTENANCE') {
    return ctx.reply('⚠️ عذراً، البوت في حالة صيانة حالياً لتحسين الخدمة. سنعود قريباً! 🩺');
  }

  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    ctx.reply(`أهلاً بك مجدداً يا دكتور ${linkedUser.name}! 🩺🌌\n\nأنا جاهز لمساعدتك في أي استفسار طبي أو أكاديمي.`, {
      reply_markup: {
        keyboard: [
          [{ text: "🧠 اسأل دكتور Q" }, { text: "📚 محاضراتي" }],
          [{ text: "⚙️ الإعدادات" }, { text: "👤 بروفايلي" }]
        ],
        resize_keyboard: true
      }
    });
  } else {
    const welcome = config?.welcomeMessage || `مرحباً بك في MedOneX AI Assistant! 🩺🌌\n\nلاستخدام البوت، يجب أن يكون لديك حساب في المنصة.`;
    ctx.reply(welcome, Markup.inlineKeyboard([
      [Markup.button.callback('🔐 تسجيل دخول', 'auth_login')],
      [Markup.button.callback('📝 إنشاء حساب جديد', 'auth_register')]
    ]));
  }
});

// ─── Auth Actions ───

bot.action('auth_register', async (ctx) => {
  await prisma.botUser.upsert({
    where: { telegramId: ctx.from!.id.toString() },
    update: { tempData: { step: 'REG_NAME' } },
    create: { telegramId: ctx.from!.id.toString(), tempData: { step: 'REG_NAME' } }
  });
  ctx.editMessageText('ممتاز! لنبدأ بإنشاء حسابك. ما هو اسمك الكامل؟');
});

bot.action('auth_login', async (ctx) => {
  await prisma.botUser.upsert({
    where: { telegramId: ctx.from!.id.toString() },
    update: { tempData: { step: 'LOG_EMAIL' } },
    create: { telegramId: ctx.from!.id.toString(), tempData: { step: 'LOG_EMAIL' } }
  });
  ctx.editMessageText('أهلاً بك مجدداً! يرجى إرسال بريدك الإلكتروني المسجل في الموقع:');
});

// ─── Settings & API Flow ───

bot.command('settings', async (ctx) => {
  const user = await getBotUser(ctx.from.id.toString());
  const provider = user.preferredProvider || 'Default';
  
  ctx.reply(`⚙️ إعدادات الذكاء الاصطناعي الخاصة بك:
  
📍 المحرك الحالي: ${provider.toUpperCase()}
🔑 مفتاح الـ API: ${user.personalKey ? '✅ مضاف' : '❌ غير مضاف'}

يمكنك تغيير المحرك أو إضافة مفتاحك الخاص باستخدام الأزرار أدناه:`, 
  Markup.inlineKeyboard([
    [Markup.button.callback('تغيير المحرك 🤖', 'change_provider')],
    [Markup.button.callback('إضافة API Key 🔑', 'set_key_hint')]
  ]));
});

bot.action('change_provider', (ctx) => {
  ctx.editMessageText('اختر محرك الذكاء الاصطناعي المفضل لديك:', 
    Markup.inlineKeyboard([
      [Markup.button.callback('Google Gemini', 'prov_gemini'), Markup.button.callback('Groq (Llama)', 'prov_groq')],
      [Markup.button.callback('xAI Grok', 'prov_xai'), Markup.button.callback('DuckDuckGo (Free)', 'prov_duckduckgo')],
      [Markup.button.callback('العودة للافتراضي', 'prov_proxy')]
    ])
  );
});

bot.action(/prov_(.+)/, async (ctx) => {
  const provider = ctx.match[1];
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { preferredProvider: provider }
  });
  ctx.answerCbQuery(`تم تغيير المحرك إلى ${provider}`);
  ctx.editMessageText(`✅ تم تحديث المحرك بنجاح إلى: ${provider.toUpperCase()}`);
});

bot.action('set_key_hint', (ctx) => {
  ctx.editMessageText('اختر المحرك الذي تريد إضافة مفتاحه:', 
    Markup.inlineKeyboard([
      [Markup.button.callback('Gemini 🧠', 'setup_gemini'), Markup.button.callback('Groq ⚡️', 'setup_groq')],
      [Markup.button.callback('OpenAI 🦾', 'setup_openai'), Markup.button.callback('إلغاء ❌', 'back_to_settings')]
    ])
  );
});

bot.action(/setup_(.+)/, async (ctx) => {
  const provider = ctx.match[1];
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { waitingForKeyProvider: provider }
  });
  ctx.editMessageText(`🔑 أرسل مفتاح الـ API الخاص بـ *${provider.toUpperCase()}* الآن.\n\nيمكنك الحصول عليه من الموقع الرسمي للمزود.`, { parse_mode: 'Markdown' });
});

bot.action('back_to_settings', async (ctx) => {
  const user = await getBotUser(ctx.from!.id.toString());
  ctx.editMessageText('⚙️ الإعدادات:', Markup.inlineKeyboard([
    [Markup.button.callback('تغيير المحرك 🤖', 'change_provider')],
    [Markup.button.callback('إضافة API Key 🔑', 'set_key_hint')]
  ]));
});

// ─── Text Handling ───

bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const botUser = await getBotUser(telegramId);
  const userMessage = ctx.message.text.trim();
  const tempData = (botUser.tempData as any) || {};

  // Handle waiting for API Key
  if (botUser.waitingForKeyProvider) {
    await prisma.botUser.update({
      where: { telegramId },
      data: { personalKey: userMessage, waitingForKeyProvider: null, preferredProvider: botUser.waitingForKeyProvider }
    });
    return ctx.reply(`✅ تم حفظ مفتاح الـ API لـ ${botUser.waitingForKeyProvider.toUpperCase()} بنجاح!`);
  }

  // Handle Auth Steps
  if (tempData.step) {
    switch (tempData.step) {
      case 'LOG_EMAIL':
        const existing = await prisma.user.findUnique({ where: { email: userMessage } });
        if (existing) {
          await prisma.user.update({ where: { id: existing.id }, data: { telegramId, telegramVerified: true } });
          await prisma.botUser.update({ where: { telegramId }, data: { tempData: Prisma.JsonNull } });
          return ctx.reply(`✅ أهلاً دكتور ${existing.name}! تم تسجيل الدخول بنجاح.`, {
            ...Markup.keyboard([
              [{ text: "🧠 اسأل دكتور Q" }, { text: "📚 محاضراتي" }],
              [{ text: "⚙️ الإعدادات" }, { text: "👤 بروفايلي" }]
            ]).resize()
          });
        }
        return ctx.reply('❌ البريد غير موجود. حاول مجدداً أو اضغط /start.');

      case 'REG_NAME':
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_EMAIL', name: userMessage } } });
        return ctx.reply(`أهلاً دكتور ${userMessage}! أرسل بريدك الإلكتروني الآن:`);

      case 'REG_EMAIL':
        const check = await prisma.user.findUnique({ where: { email: userMessage } });
        if (check) return ctx.reply('❌ البريد مسجل بالفعل. اختر بريداً آخر:');
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_PASS', email: userMessage } } });
        return ctx.reply('اختر كلمة مرور (6 أحرف على الأقل):');

      case 'REG_PASS':
        if (userMessage.length < 6) return ctx.reply('⚠️ قصيرة جداً، اختر كلمة أخرى:');
        const hashed = await bcrypt.hash(userMessage, 10);
        await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_UNI', password: hashed } } });
        const unis = await prisma.university.findMany({ select: { id: true, name: true }, take: 8 });
        return ctx.reply('اختر جامعتك:', Markup.inlineKeyboard(unis.map(u => [Markup.button.callback(u.name, `reg_uni_${u.id}`)])));
    }
  }

  // AI Response
  const linkedUser = await getLinkedUser(telegramId);
  if (!linkedUser) {
    return ctx.reply('⚠️ يجب تسجيل الدخول أولاً.', Markup.inlineKeyboard([
      [Markup.button.callback('🔐 تسجيل دخول', 'auth_login')],
      [Markup.button.callback('📝 إنشاء حساب جديد', 'auth_register')]
    ]));
  }

  await ctx.sendChatAction('typing');
  try {
    const globalConfig = await getGlobalConfig();
    const systemPrompt = `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER INFO] Name: ${linkedUser.name}, Uni: ${linkedUser.university?.name}, Sem: ${linkedUser.semester?.name}`;
    const provider = botUser.preferredProvider !== 'proxy' ? botUser.preferredProvider : (globalConfig?.defaultProvider || 'gemini');
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt, {
      preferredProvider: provider as any,
      personalKey: botUser.personalKey || undefined,
      useCustomKey: !!botUser.personalKey
    });
    await ctx.reply(aiResponse.text, { parse_mode: 'Markdown' });
  } catch (e: any) {
    ctx.reply(`خطأ: ${e.message}`);
  }
});

// ─── University/Faculty/Semester Callbacks ───

bot.action(/reg_uni_(.+)/, async (ctx) => {
  const uniId = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_FAC', universityId: uniId } } });
  const faculties = await prisma.faculty.findMany({ where: { universityId: uniId }, select: { id: true, name: true } });
  ctx.editMessageText('اختر كليتك:', Markup.inlineKeyboard(faculties.map(f => [Markup.button.callback(f.name, `reg_fac_${f.id}`)])));
});

bot.action(/reg_fac_(.+)/, async (ctx) => {
  const facId = ctx.match[1];
  const telegramId = ctx.from!.id.toString();
  const botUser = await getBotUser(telegramId);
  const tempData = (botUser.tempData as any) || {};
  await prisma.botUser.update({ where: { telegramId }, data: { tempData: { ...tempData, step: 'REG_SEM', facultyId: facId } } });
  // Find semesters that belong to this faculty
  const semesters = await prisma.semester.findMany({ 
    where: { 
      facultySemesters: {
        some: { facultyId: facId }
      }
    }, 
    select: { id: true, name: true } 
  });
  ctx.editMessageText('اختر السيمستر:', Markup.inlineKeyboard(semesters.map(s => [Markup.button.callback(s.name, `reg_sem_${s.id}`)])));
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
  ctx.editMessageText(`🎊 مبروك يا دكتور ${newUser.name}! تم إنشاء حسابك.`, {
    ...Markup.keyboard([
      [{ text: "🧠 اسأل دكتور Q" }, { text: "📚 محاضراتي" }],
      [{ text: "⚙️ الإعدادات" }, { text: "👤 بروفايلي" }]
    ]).resize()
  });
});

// ─── API Route ───

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
