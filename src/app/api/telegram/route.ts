
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { DR_Q_SYSTEM_PROMPT } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Helpers ────────────────────────────────────────────────────────────────

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

bot.start((ctx) => {
  ctx.reply(`أهلاً بك يا ${ctx.from.first_name} في MedOneX AI Assistant! 🩺🌌\n\nأنا دكتور Q، مساعدك الطبي الذكي. يمكنك سؤالي عن أي شيء يخص دراستك الطبية أو الاستفسارات الصحية العامة.\n\nاستخدم /settings لضبط إعدادات الـ API الخاصة بك.`);
});

bot.help((ctx) => {
  ctx.reply(` قائمة الأوامر المتاحة:
🩺 /start - بدء المحادثة والترحيب.
⚙️ /settings - ضبط محرك الذكاء الاصطناعي و الـ API Key.
❓ /help - عرض قائمة المساعدة هذه.
🏥 /about - معلومات عن دكتور Q ومنصة MedOneX.
🌐 /website - الانتقال إلى موقع المنصة الرسمي.
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
  ctx.reply('لإضافة مفتاح الـ API الخاص بك، استخدم الأمر التالي:\n\n`/setkey YOUR_API_KEY`', { parse_mode: 'Markdown' });
});

bot.command('setkey', async (ctx) => {
  const key = ctx.message.text.split(' ')[1];
  if (!key) return ctx.reply('يرجى كتابة المفتاح بعد الأمر، مثال:\n/setkey sk-xxxxx');
  
  await prisma.botUser.update({
    where: { telegramId: ctx.from.id.toString() },
    data: { personalKey: key }
  });
  
  ctx.reply('✅ تم حفظ مفتاح الـ API الخاص بك بنجاح! سأقوم باستخدامه في ردودي القادمة.');
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
  const userMessage = ctx.message.text;
  
  // Show "typing" status in Telegram
  await ctx.sendChatAction('typing');

  try {
    const user = await getBotUser(ctx.from.id.toString());
    const systemPrompt = `${DR_Q_SYSTEM_PROMPT}\n\n(Context: You are answering via Telegram. Be concise, use emojis where appropriate, and ensure formatting is clean for mobile reading.)`;
    
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt, {
      preferredProvider: user.preferredProvider || undefined,
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
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// Optional: GET handler to verify the bot is alive
export async function GET() {
  return NextResponse.json({ status: 'MedQs Telegram Bot is active' });
}
