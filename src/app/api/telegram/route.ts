
import { Telegraf, Markup } from 'telegraf';
import { NextResponse } from 'next/server';
import { generateAIReplyWithFallback } from '@/lib/ai-router';
import { MEDICAL_TUTOR_SYSTEM_PREFIX } from '@/lib/medical-ai-prompts';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID;
const BASE_URL = process.env.NEXTAUTH_URL || 'https://medonex.vercel.app';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '8730612796:AAEgChDIg9OU7-uSTffYeb_sjsE5kXGg9eY');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getLinkedUser(telegramId: string) {
  // 1. Check direct link via telegramId
  const directLink = await (prisma.user as any).findFirst({
    where: { telegramId: telegramId.toString() },
    include: { university: true, semester: true }
  });
  if (directLink) return directLink;

  // 2. Check if we have a phone number for this bot user
  const botUser = await (prisma as any).botUser.findUnique({
    where: { telegramId: telegramId.toString() },
    select: { phoneNumber: true }
  });

  if (botUser?.phoneNumber) {
    // 3. Check if any user in MedQs has this telegramPhone
    const userByPhone = await (prisma.user as any).findFirst({
      where: { telegramPhone: botUser.phoneNumber },
      include: { university: true, semester: true }
    });

    if (userByPhone) {
      // 4. AUTO-LINK: Save the telegramId to this user for future direct links
      await (prisma.user as any).update({
        where: { id: userByPhone.id },
        data: { telegramId: telegramId.toString(), telegramVerified: true }
      });
      return userByPhone;
    }
  }

  return null;
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
  [{ text: "👤 My Profile" }],
  [Markup.button.webApp("🚀 Open MedOneX TMA", `${BASE_URL}/tma`)]
]).resize();

// ─── Bot Logic ───

bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const linkedUser = await getLinkedUser(telegramId);
    
    if (linkedUser) {
      const universityName = linkedUser.university?.name || "MedQs University";
      const semesterName = linkedUser.semester?.name || "Global Semester";
      
      await ctx.reply(
        `Welcome back, Dr. ${linkedUser.name}! 🩺🌌\n\n` +
        `🏫 *University:* ${universityName}\n` +
        `📚 *Current Semester:* ${semesterName}\n\n` +
        `How can I help you with your studies today?`, 
        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
      );
    } else {
      await ctx.reply(
        `Welcome to MedOneX! 🩺🌌\n\n` +
        `🚀 *Quick Login:* Just send me the *Email* you used to register on the site, and I'll link your account instantly!\n\n` +
        `Or use our new Mini App to explore:`, 
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Open MedOneX TMA', `${BASE_URL}/tma`)],
            [Markup.button.callback('🔐 Login with Web Code', 'auth_login')],
            [Markup.button.callback('📱 Link via Phone (Registration)', 'auth_phone')],
            [Markup.button.callback('📝 Quick Register', 'auth_register')]
          ])
        }
      );
    }
  } catch (err: any) {
    console.error("[BOT] Start Error:", err);
    ctx.reply(`❌ Error during start: ${err.message}`);
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

bot.action('auth_phone', async (ctx) => {
  await ctx.reply(
    "📱 Please share your contact to verify your phone number on the platform:",
    Markup.keyboard([
      [Markup.button.contactRequest("📤 Share My Contact")]
    ]).oneTime().resize()
  );
});

bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = ctx.from.id.toString();
  const phoneNumber = contact.phone_number.replace('+', '');

  await (prisma as any).botUser.upsert({
    where: { telegramId },
    update: { phoneNumber },
    create: { telegramId, phoneNumber }
  });

  await ctx.reply(
    `✅ Phone number ${phoneNumber} is now linked to your Telegram account!\n\nYou can now go back to the registration page and request a verification code.`,
    Markup.removeKeyboard()
  );
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
        const forwarded = await ctx.telegram.copyMessage(STORAGE_GROUP_ID, ctx.from!.id, sentMessage.message_id, {
          message_thread_id: 1 // General topic
        });
        // Save the IDs for next time to reduce DB/Link load
        const modelName = itemAny.title ? 'lectureVideo' : (itemAny.name ? 'lectureFile' : null);
        if (modelName) {
          await (prisma as any)[modelName].update({
            where: { id: itemAny.id },
            data: { telegramChatId: STORAGE_GROUP_ID.toString(), telegramMessageId: forwarded.message_id }
          }).catch(() => {});
        }
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
    where: { lectureId: lecId }
  });

  if (questions.length === 0) {
    return ctx.answerCbQuery('⚠️ No questions found for this lecture.');
  }

  // Shuffle and take 10
  const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
  
  await ctx.answerCbQuery('Starting Quiz Batch! 📝');
  await ctx.editMessageText(`📝 *Starting Quiz Session*\nLecture: ${lecId.slice(0,8)}...\nQuestions: ${shuffled.length}\n\n_Sending questions as native polls..._`, { parse_mode: 'Markdown' });

  for (const [i, q] of shuffled.entries()) {
    try {
      const options = q.choices as string[];
      const correctIdx = options.indexOf(q.answer);
      
      const questionText = `[${i+1}/${shuffled.length}] ${q.body}`;
      
      // Telegram Poll question limit is 300 chars. 
      // If it's longer, send the text first, then an empty-ish poll question.
      if (questionText.length > 300) {
        await ctx.reply(questionText, { parse_mode: 'Markdown' });
        await ctx.replyWithQuiz(
          `☝️ Solve the question above:`,
          options,
          {
            correct_option_id: correctIdx >= 0 ? correctIdx : 0,
            explanation: q.explanation || "Review the lecture material.",
            is_anonymous: false
          }
        );
      } else {
        await ctx.replyWithQuiz(
          questionText,
          options,
          {
            correct_option_id: correctIdx >= 0 ? correctIdx : 0,
            explanation: q.explanation || "Review the lecture material.",
            is_anonymous: false
          }
        );
      }
      
      // Increase delay to be safer against flood limits (1 second)
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`[BOT] Poll ${i+1} Error:`, err?.message);
      // Fallback: send as text buttons if poll fails
      await ctx.reply(`⚠️ Could not send poll for Q${i+1}. Skipping...`);
    }
  }

  return ctx.reply("🏁 All questions delivered! Solve them at your own pace.");
});

// Remove the old ans_ handler as we use native polls now
bot.action(/ans_(.+)/, (ctx) => ctx.answerCbQuery());

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
  const linkedUser = await getLinkedUser(telegramId);

  // 🤫 Group Silence Mode
  if (ctx.chat.type !== 'private') {
    const isMentioned = text.includes(`@${ctx.botInfo.username}`);
    const isMedonex = text.toLowerCase().startsWith('medonex');
    const isReplyToBot = ctx.message.reply_to_message?.from?.id === ctx.botInfo.id;
    
    if (!isMentioned && !isMedonex && !isReplyToBot) return; // Ignore if not summoned
  }

  // Handle Email-based Login Linking
  if (!linkedUser) {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const userToLink = await (prisma.user as any).findUnique({ where: { email } });
      
      if (userToLink) {
        // Unlink old telegram if any
        await (prisma.user as any).updateMany({
           where: { telegramId },
           data: { telegramId: null, telegramVerified: false }
        });

        await (prisma.user as any).update({
          where: { id: userToLink.id },
          data: { 
            telegramId: telegramId,
            telegramVerified: true 
          }
        });
        return ctx.reply(`✅ Account successfully linked!\n\nWelcome Dr. ${userToLink.name}! 🩺🌌\nYou can now access all your lectures and clinical tools here.`, MAIN_KEYBOARD);
      } else {
        return ctx.reply(`❌ We couldn't find an account with the email: ${email}\n\nPlease make sure you are registered on the MedOneX platform.`);
      }
    }
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
  if (!linkedUser) return ctx.reply('Please login to chat. /start');

  if (text === "🧠 Ask Dr. Q") return ctx.reply("I'm listening! Ask me anything.");
  if (text === "📊 Dashboard") {
    return ctx.reply(`📊 *Dashboard*\n\nName: ${linkedUser?.name}\nPoints: ${linkedUser?.points || 0}`, { parse_mode: 'Markdown' });
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

    const replyOptions: any = { parse_mode: 'Markdown' };
    if (ctx.chat.type !== 'private') {
      replyOptions.reply_to_message_id = ctx.message.message_id;
    }

    const replyMessage = await ctx.reply(ai.text, replyOptions);

    // Forward AI response to data group for searchable archive
    if (STORAGE_GROUP_ID && replyMessage) {
      try {
        await ctx.telegram.copyMessage(STORAGE_GROUP_ID, ctx.from!.id, replyMessage.message_id, {
          message_thread_id: 1 // General topic
        });
      } catch (err) {
        console.error("AI Storage Forward Error:", err);
      }
    }
  } catch (error: any) {
    console.error("Bot AI Error:", error);
    ctx.reply(`🩺 Dr. Q Error: ${error.message || 'Unknown failure'}`);
  }
});

// ─── Media Publishing Handlers ───

bot.on(['video', 'photo'], async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const linkedUser = await getLinkedUser(telegramId);
  
  if (!linkedUser) {
    return ctx.reply("⚠️ Your account is not linked. Please send me your registered Email first to enable publishing.");
  }

  const caption = (ctx.message as any).caption || "";
  const universityId = linkedUser.universityId;
  
  if (!universityId) {
    return ctx.reply("❌ Your profile is missing university info. Please update your profile on the site.");
  }

  // Find the Global forum for this university
  const globalForum = await prisma.forum.findFirst({
    where: { universityId, type: 'GLOBAL' }
  });

  if (!globalForum) {
    return ctx.reply("❌ Global forum not found for your university. Please contact support.");
  }

  await ctx.reply("🔄 Processing your media for the forum... 🚀");

  try {
    let attachment: any = null;
    
    if ((ctx.message as any).video) {
      const video = (ctx.message as any).video;
      attachment = {
        url: `/api/v1/files/telegram/preview?fileId=${video.file_id}&type=video`,
        type: 'video',
        fileId: video.file_id
      };
    } else if ((ctx.message as any).photo) {
      const photo = (ctx.message as any).photo.pop(); // Get largest version
      attachment = {
        url: `/api/v1/files/telegram/preview?fileId=${photo.file_id}&type=image`,
        type: 'image',
        fileId: photo.file_id
      };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);

    const post = await (prisma.post as any).create({
      data: {
        content: caption || (attachment.type === 'video' ? "Sent a video from Telegram" : "Sent a photo from Telegram"),
        authorId: linkedUser.id,
        imageUrl: attachment.url, // Set for legacy support
        forumId: globalForum.id,
        universityId,
        attachments: [attachment],
        audience: 'UNIVERSITY',
        expiresAt,
        isForumPost: true
      }
    });

    await ctx.reply(
      `✅ **Published to MedQs Community!** 🚀\n\n` +
      `📌 Topic: ${globalForum.name}\n` +
      `🔗 [View your post here](${BASE_URL}/forum/post/${post.id})`,
      { parse_mode: 'Markdown' }
    );

    // Forward to storage group for backup
    if (STORAGE_GROUP_ID) {
      await ctx.telegram.copyMessage(STORAGE_GROUP_ID, ctx.from.id, ctx.message.message_id, {
        caption: `Published by Dr. ${linkedUser.name} (@${ctx.from.username || 'N/A'})\nPost ID: ${post.id}`,
        message_thread_id: 1
      }).catch(() => {});
    }

  } catch (err: any) {
    console.error("[BOT-MEDIA] Publishing Error:", err);
    ctx.reply(`❌ Failed to publish: ${err.message}`);
  }
});

// Webhook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ⚡ Early Exit Optimization: Ignore updates that aren't messages or actions
    // This saves "Function Invocations" and "CPU Time" on Vercel
    if (!body.message && !body.callback_query && !body.inline_query) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Ignore edited messages to save processing
    if (body.edited_message) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log(`[TELEGRAM] Processing update: ${body.update_id}`);
    
    // Use a faster response pattern
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[TELEGRAM] Webhook Error:", e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 200 });
  }
}
