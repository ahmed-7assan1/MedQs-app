
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { DR_Q_SYSTEM_PROMPT } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getLinkedUser(telegramId: string) {
  return await prisma.user.findUnique({
    where: { telegramId },
    include: { university: true, semester: true }
  });
}

async function getGlobalConfig() {
  return await prisma.telegramConfig.findUnique({
    where: { id: 'global' }
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

// ─── Telegram Bot Logic ──────────────────────────────────────────────────────

bot.start(async (ctx) => {
  const config = await getGlobalConfig();
  if (config?.botStatus === 'MAINTENANCE') {
    return ctx.reply('⚠️ عذراً، البوت في حالة صيانة حالياً لتحسين الخدمة. سنعود قريباً! 🩺');
  }

  const linkedUser = await getLinkedUser(ctx.from.id.toString());
  if (linkedUser) {
    ctx.reply(`أهلاً بك مجدداً يا دكتور ${linkedUser.name}! 🩺🌌\n\nلقد تم ربط حسابك بنجاح. أنا الآن أعرف أنك طالب في ${linkedUser.university?.name || 'جامعتك'} (السيمستر ${linkedUser.semester?.name || '-'}). كيف يمكنني مساعدتك اليوم؟`);
  } else {
    const welcome = config?.welcomeMessage || `أهلاً بك في MedOneX AI Assistant! 🩺🌌\n\nللبدء، يجب عليك ربط حسابك بالموقع لتتمكن من الوصول لبياناتك ومحاضراتك.\n\nاستخدم أمر /login للحصول على كود الربط.`;
    ctx.reply(welcome);
  }
});

bot.command('login', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const existingUser = await getLinkedUser(telegramId);
  
  if (existingUser) {
    return ctx.reply(`حسابك مربوط بالفعل باسم: ${existingUser.name}`);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.botAuth.upsert({
    where: { telegramId },
    update: { code, expiresAt },
    create: { telegramId, code, expiresAt }
  });

  ctx.reply(`🔑 كود الربط الخاص بك هو: \`${code}\`\n\nقم بنسخ هذا الكود والذهاب إلى "إعدادات البروفايل" في الموقع ووضعه هناك لإتمام عملية الربط.\n\n⚠️ الكود صالح لمدة 10 دقائق فقط.`, { parse_mode: 'MarkdownV2' });
});

bot.help((ctx) => {
  ctx.reply(` قائمة الأوامر المتاحة:
🩺 /start - بدء المحادثة والترحيب.
🔑 /login - ربط حسابك بالموقع.
⚙️ /settings - ضبط محرك الذكاء الاصطناعي و الـ API Key.
❓ /help - عرض قائمة المساعدة هذه.
💬 فقط أرسل سؤالك الطبي مباشرة وسأرد عليك فوراً!`);
});

// Settings Command
bot.command('settings', async (ctx) => {
  const user = await getBotUser(ctx.from.id.toString());
  const provider = user.preferredProvider || 'Default';
  
  ctx.reply(`⚙️ إعدادات الذكاء الاصطناعي الخاصة بك:
  
📍 المحرك الحالي: ${provider.toUpperCase()}
🔑 مفتاح الـ API: ${user.personalKey ? '✅ مضاف' : '❌ غير مضاف'}

يمكنك تغيير المحرك أو إضافة مفتاحك الخاص باستخدام الأزرار أدناه:`, 
  Markup.inlineKeyboard([
    [Markup.button.callback('تغيير المحرك 🤖', 'change_provider')],
    [Markup.button.callback('إضافة/تعديل API Key 🔑', 'set_key_hint')]
  ]));
});

// Action Handlers
bot.action('change_provider', (ctx) => {
  ctx.editMessageText('اختر محرك الذكاء الاصطناعي المفضل لديك ليتم استخدامه افتراضياً:', 
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

// Interactive API Key Setup
bot.action('set_key_hint', (ctx) => {
  ctx.editMessageText('اختر المحرك الذي تريد إضافة مفتاح الـ API الخاص به:', 
    Markup.inlineKeyboard([
      [Markup.button.callback('Google Gemini 🧠', 'setup_gemini'), Markup.button.callback('Groq (Llama) ⚡️', 'setup_groq')],
      [Markup.button.callback('xAI Grok 🌌', 'setup_xai'), Markup.button.callback('OpenAI (GPT) 🦾', 'setup_openai')],
      [Markup.button.callback('العودة للإعدادات ⚙️', 'back_to_settings')]
    ])
  );
});

bot.action(/setup_(.+)/, async (ctx) => {
  const provider = ctx.match[1];
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { waitingForKeyProvider: provider }
  });
  
  let helpText = '';
  let helpUrl = '';
  
  switch(provider) {
    case 'gemini': 
      helpText = 'للحصول على مفتاح Gemini مجاناً:\n1. اذهب إلى Google AI Studio.\n2. اضغط على Get API Key.';
      helpUrl = 'https://aistudio.google.com/app/apikey';
      break;
    case 'groq':
      helpText = 'للحصول على مفتاح Groq (الأسرع):\n1. اذهب إلى Groq Console.\n2. أنشئ مفتاحاً جديداً.';
      helpUrl = 'https://console.groq.com/keys';
      break;
    case 'openai':
      helpText = 'للحصول على مفتاح OpenAI:\n1. اذهب إلى OpenAI Dashboard.\n2. أنشئ API Key.';
      helpUrl = 'https://platform.openai.com/api-keys';
      break;
    default:
      helpText = 'يرجى الذهاب لموقع المزود الرسمي للحصول على المفتاح.';
  }

  await ctx.editMessageText(`🔑 لقد اخترت إعداد مفتاح لـ *${provider.toUpperCase()}*\n\n${helpText}\n\n*أرسل المفتاح الآن في رسالة نصية ليتم حفظه.*`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('فتح صفحة الـ API 🔗', helpUrl)],
      [Markup.button.callback('إلغاء ❌', 'back_to_settings')]
    ])
  });
});

bot.action('back_to_settings', async (ctx) => {
  const user = await getBotUser(ctx.from!.id.toString());
  const provider = user.preferredProvider || 'Default';
  await prisma.botUser.update({
    where: { telegramId: ctx.from!.id.toString() },
    data: { waitingForKeyProvider: null }
  });
  ctx.editMessageText(`⚙️ إعدادات الذكاء الاصطناعي الخاصة بك:
  
📍 المحرك الحالي: ${provider.toUpperCase()}
🔑 مفتاح الـ API: ${user.personalKey ? '✅ مضاف' : '❌ غير مضاف'}

يمكنك تغيير المحرك أو إضافة مفتاحك الخاص باستخدام الأزرار أدناه:`, 
  Markup.inlineKeyboard([
    [Markup.button.callback('تغيير المحرك 🤖', 'change_provider')],
    [Markup.button.callback('إضافة/تعديل API Key 🔑', 'set_key_hint')]
  ]));
});

bot.command('setkey', async (ctx) => {
  const key = ctx.message.text.split(' ')[1];
  if (!key) return ctx.reply('يرجى كتابة المفتاح بعد الأمر، مثال:\n/setkey sk-xxxxx');
  
  await prisma.botUser.update({
    where: { telegramId: ctx.from.id.toString() },
    data: { personalKey: key, waitingForKeyProvider: null }
  });
  
  ctx.reply('✅ تم حفظ مفتاح الـ API الخاص بك بنجاح!');
});

bot.command('about', (ctx) => {
  ctx.reply(`👨‍⚕️ دكتور Q (Dr. Q):
هو رفيقك الذكي في رحلة الطب، مبرمج ومدرب على أحدث المناهج الطبية لمساعدتك في فهم الحالات الصعبة والمذاكرة بذكاء.\n\nمنصة MedOneX: هي منصتك التعليمية الشاملة لطلاب الطب.`);
});

bot.command('website', (ctx) => {
  ctx.reply('تفضل بزيارة منصتنا لمتابعة محاضراتك وكويزاتك:\nhttps://medonex.vercel.app');
});

// Register commands in the Telegram menu automatically
try {
  bot.telegram.setMyCommands([
    { command: 'start', description: 'بدء المحادثة' },
    { command: 'settings', description: 'إعدادات الـ API' },
    { command: 'help', description: 'قائمة المساعدة' },
    { command: 'about', description: 'عن دكتور Q' },
    { command: 'website', description: 'رابط المنصة' }
  ]);
} catch (e) {
  console.error('Failed to set commands:', e);
}

// Handle text messages with AI
bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await getBotUser(telegramId);

  // Check if we are waiting for an API Key
  if (user.waitingForKeyProvider) {
    const key = ctx.message.text.trim();
    if (key.length < 10) return ctx.reply('❌ يبدو أن المفتاح غير صحيح، يرجى التأكد وإرساله مجدداً أو الضغط على /start للإلغاء.');
    
    await prisma.botUser.update({
      where: { telegramId },
      data: { 
        personalKey: key, 
        waitingForKeyProvider: null,
        preferredProvider: user.waitingForKeyProvider 
      }
    });
    
    return ctx.reply(`✅ تم بنجاح حفظ مفتاح الـ API لـ *${user.waitingForKeyProvider.toUpperCase()}*\nسأستخدمه الآن في جميع ردودي القادمة.`, { parse_mode: 'Markdown' });
  }

  const userMessage = ctx.message.text.toLowerCase();
  
  // 🔍 Founder Recognition Logic
  const founderKeywords = ['مؤسس', 'الفاوندر', 'اللى عملك', 'مين عملك', 'مين برمجك', 'founder', 'who made you', 'who created you'];
  if (founderKeywords.some(k => userMessage.includes(k))) {
    try {
      const founder = await prisma.platformMember.findFirst({
        where: { role: { contains: 'Founder', mode: 'insensitive' } }
      });

      if (founder) {
        if (founder.imageUrl) {
          await ctx.replyWithPhoto(founder.imageUrl, {
            caption: `👨‍⚕️ أنا من ابتكار المبدع: *${founder.name}*\n\n🌟 الدور: ${founder.role}\n\n📖 نبذة: ${founder.description || 'المؤسس والعقل المدبر وراء منصة MedOneX وذكاء Dr. Q.'}\n\nلقد تم تطويري لأكون رفيقك الطبي الأمثل! 🩺🌌`,
            parse_mode: 'Markdown'
          });
        } else {
          await ctx.reply(`👨‍⚕️ أنا من ابتكار المبدع: *${founder.name}* (المؤسس).\n\nلقد تم تطويري لأكون رفيقك الطبي الأمثل! 🩺🌌`, { parse_mode: 'Markdown' });
        }
        return;
      }
    } catch (e) {
      console.error('Founder Fetch Error:', e);
    }
  }

  // Show "typing" status in Telegram
  await ctx.sendChatAction('typing');

  try {
    const [linkedUser, globalConfig] = await Promise.all([
      getLinkedUser(telegramId),
      getGlobalConfig()
    ]);

    if (globalConfig?.botStatus === 'MAINTENANCE') {
      return ctx.reply('⚠️ عذراً، البوت في حالة صيانة حالياً. سنعود قريباً!');
    }

    let personalizedSystemPrompt = DR_Q_SYSTEM_PROMPT;
    
    if (linkedUser) {
      personalizedSystemPrompt += `\n\n[USER INFO]
- Name: ${linkedUser.name}
- University: ${linkedUser.university?.name || 'Unknown'}
- Semester: ${linkedUser.semester?.name || 'Unknown'}
- Instruction: Address the user as "Doctor ${linkedUser.name}". Be aware of their university and semester context when answering academic questions.`;
    }

    personalizedSystemPrompt += `\n\n(Identity Rule: You were created by Ahmed M. Hassan, the founder of MedOneX. If asked about your origin, always mention him with respect.)\n\n(Context: You are answering via Telegram. Be concise, use emojis where appropriate, and ensure formatting is clean for mobile reading.)`;
    
    const preferredProvider = user.preferredProvider && user.preferredProvider !== 'proxy' 
      ? user.preferredProvider 
      : (globalConfig?.defaultProvider || 'gemini');

    const aiResponse = await generateAIReplyWithFallback(userMessage, personalizedSystemPrompt, {
      preferredProvider: preferredProvider as any,
      personalKey: user.personalKey || undefined,
      useCustomKey: !!user.personalKey,
      customProvider: user.preferredProvider as any
    });
    
    // Parse response if it's JSON (like in the web app)
    let replyText = aiResponse.text;
    try {
      if (replyText.trim().startsWith('{')) {
        const data = JSON.parse(replyText);
        replyText = data.reply || data.content || replyText;
      }
    } catch (e) {}

    await ctx.reply(replyText, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('Telegram AI Error:', error);
    await ctx.reply(`عذراً، واجهت مشكلة: ${error.message || 'مشكلة في معالجة طلبك'}`);
  }
});

// ─── API Route Handler ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook Error:', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// Optional: GET handler to verify the bot is alive
export async function GET() {
  return NextResponse.json({ status: 'MedQs Telegram Bot is active' });
}
