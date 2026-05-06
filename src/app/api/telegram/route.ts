
import { Telegraf } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { DR_Q_SYSTEM_PROMPT } from '@/lib/medical-ai-prompts';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Telegram Bot Logic ──────────────────────────────────────────────────────

bot.start((ctx) => {
  ctx.reply(`أهلاً بك يا ${ctx.from.first_name} في MedOneX AI Assistant! 🩺🌌\n\nأنا دكتور Q، مساعدك الطبي الذكي. يمكنك سؤالي عن أي شيء يخص دراستك الطبية أو الاستفسارات الصحية العامة.\n\nاستخدم /help لرؤية قائمة الأوامر المتاحة.`);
});

bot.help((ctx) => {
  ctx.reply(` قائمة الأوامر المتاحة:
🩺 /start - بدء المحادثة والترحيب.
❓ /help - عرض قائمة المساعدة هذه.
🏥 /about - معلومات عن دكتور Q ومنصة MedOneX.
🌐 /website - الانتقال إلى موقع المنصة الرسمي.
💬 فقط أرسل سؤالك الطبي مباشرة وسأرد عليك فوراً!`);
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
    const systemPrompt = `${DR_Q_SYSTEM_PROMPT}\n\n(Context: You are answering via Telegram. Be concise, use emojis where appropriate, and ensure formatting is clean for mobile reading.)`;
    
    const aiResponse = await generateAIReplyWithFallback(userMessage, systemPrompt);
    
    // Parse response if it's JSON (like in the web app)
    let replyText = aiResponse.text;
    try {
      if (replyText.trim().startsWith('{')) {
        const data = JSON.parse(replyText);
        replyText = data.reply || data.content || replyText;
      }
    } catch (e) {}

    await ctx.reply(replyText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Telegram AI Error:', error);
    await ctx.reply('عذراً، واجهت مشكلة في معالجة طلبك حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
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
