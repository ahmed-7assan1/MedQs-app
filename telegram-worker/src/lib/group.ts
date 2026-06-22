import { Telegraf, Context } from "telegraf";
import { getLinkedUser, downloadTelegramFile, getConversationHistory, addConversationMessage } from "./helpers";
import { generateAIReply, escapeMarkdown } from "./ai";
import { groupMentionKeyboard } from "./keyboards";

const BOT_USERNAME = "MedOneX_bot";
const BOT_ARABIC = "ميدونكس";

function isGroupChat(ctx: Context): boolean {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}

function isBotMentioned(ctx: Context): boolean {
  const msg = ctx.message as any;
  if (!msg?.text && !msg?.caption) return false;
  const text = msg.text || msg.caption;
  const lower = text.toLowerCase();
  return lower.includes(`@${BOT_USERNAME.toLowerCase()}`) || lower.includes(BOT_ARABIC);
}

function getMediaFromMessage(msg: any): { fileId: string } | null {
  if (msg.photo) return { fileId: msg.photo[msg.photo.length - 1].file_id };
  if (msg.document) return { fileId: msg.document.file_id };
  if (msg.video) return { fileId: msg.video.file_id };
  return null;
}

function getReplyContext(ctx: Context): string {
  const replyTo = (ctx.message as any)?.reply_to_message;
  if (!replyTo) return "";
  const replyText = replyTo.text || replyTo.caption || "";
  const replyFrom = replyTo.from;
  if (!replyText && !getMediaFromMessage(replyTo)) return "";
  const fromName = replyFrom?.first_name || "User";
  const isBot = replyFrom?.is_bot;
  if (!replyText && getMediaFromMessage(replyTo)) {
    return `\n[Replying to ${isBot ? "my previous message" : `${fromName}'s message`} which contained media]`;
  }
  return `\n[Replying to ${isBot ? "my previous message" : `${fromName}'s message`}: "${replyText}"]`;
}

export function registerGroup(bot: Telegraf, env: Record<string, string | undefined>) {
  const envKeys: Record<string, string> = { duckduckgo: "free" };
  for (const p of ["gemini", "groq", "openrouter", "siliconflow", "deepseek", "xai", "huggingface", "mistral"]) {
    const keyVar = `${p.toUpperCase()}_API_KEY`;
    if (env[keyVar]) envKeys[p] = env[keyVar]!;
  }
  const extraGemini = [env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4].filter((k): k is string => !!k);
  const allGeminiKeys = envKeys.gemini ? [envKeys.gemini, ...extraGemini] : extraGemini;

  bot.on("text", async (ctx, next) => {
    try {
      if (!isGroupChat(ctx)) return next();
      const isReplyToBot = ctx.message.reply_to_message?.from?.id === ctx.botInfo.id;
      if (!isBotMentioned(ctx) && !isReplyToBot) return next();

      const messageText = ((ctx.message as any).text ?? "").trim();
      const cleanText = messageText
        .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
        .replace(new RegExp(BOT_ARABIC, "g"), "")
        .trim();

      if (!cleanText) {
        const tid = ctx.from!.id.toString();
        const linked = await getLinkedUser(tid);
        const greeting = linked
          ? `👋 Hi *${linked.name}*! I'm MedOneX AI assistant.\n\nHow can I help?`
          : "👋 Hi! I'm *MedOneX AI assistant*.\n\nChoose an option:";
        await ctx.reply(greeting, {
          parse_mode: "Markdown",
          ...groupMentionKeyboard(),
          reply_parameters: { message_id: ctx.message.message_id },
        });
        return;
      }

      const replyTo = (ctx.message as any).reply_to_message;
      let replyMedia: { data: string; mimeType: string } | null = null;
      if (replyTo && env.TELEGRAM_BOT_TOKEN) {
        const mediaInfo = getMediaFromMessage(replyTo);
        if (mediaInfo) {
          replyMedia = await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN, mediaInfo.fileId);
        }
      }

      const replyContext = getReplyContext(ctx);
      const fullText = replyContext ? `${cleanText}\n\n${replyContext}` : cleanText;

      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      const history = await getConversationHistory(tid);

      await ctx.sendChatAction("typing");

      try {
        const reply = replyMedia
          ? await generateAIReply(linked, fullText, "gemini", envKeys, replyMedia, history)
          : await generateAIReply(linked, fullText, "gemini", envKeys, undefined, history);
        const safe = escapeMarkdown(reply);
        if (safe.length > 4000) {
          for (let i = 0; i < safe.length; i += 4000) {
            await ctx.reply(safe.slice(i, i + 4000), {
              parse_mode: "Markdown",
              reply_parameters: { message_id: ctx.message.message_id },
            });
          }
        } else {
          await ctx.reply(safe, {
            parse_mode: "Markdown",
            reply_parameters: { message_id: ctx.message.message_id },
          });
        }
        await addConversationMessage(tid, "user", fullText);
        await addConversationMessage(tid, "assistant", reply);
      } catch (e: any) {
        console.error("[Group AI] Error:", e.message);
        await ctx.reply("❌ Sorry, I couldn't process that.", {
          reply_parameters: { message_id: ctx.message.message_id },
        });
      }
      return;
    } catch (e) {
      console.error("group handler error:", e);
      return next();
    }
  });

  bot.on(["photo", "document", "video"], async (ctx, next) => {
    try {
      if (!isGroupChat(ctx)) return next();
      const isReplyToBot = ctx.message.reply_to_message?.from?.id === ctx.botInfo.id;
      if (!isBotMentioned(ctx) && !isReplyToBot) return next();

      const msg = ctx.message as any;
      let fileId: string | undefined;
      const caption = (msg.caption || "").trim();
      let cleanText = caption
        .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
        .replace(new RegExp(BOT_ARABIC, "g"), "")
        .trim();
      if (!cleanText) cleanText = "Analyze this media from a medical perspective.";

      const replyContext = getReplyContext(ctx);
      if (replyContext) cleanText += `\n\n${replyContext}`;

      if (msg.photo) {
        fileId = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.document) {
        const doc = msg.document;
        fileId = doc.file_id;
      } else if (msg.video) {
        fileId = msg.video.file_id;
      }

      if (!fileId || !env.TELEGRAM_BOT_TOKEN) return next();

      await ctx.sendChatAction("typing");

      const media = await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN, fileId);
      if (!media) {
        await ctx.reply("❌ Could not download the file.", {
          reply_parameters: { message_id: ctx.message.message_id },
        });
        return;
      }

      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      const history = await getConversationHistory(tid);
      const reply = await generateAIReply(linked, cleanText, "gemini", envKeys, media, history);
      const safe = escapeMarkdown(reply);

      if (safe.length > 4000) {
        for (let i = 0; i < safe.length; i += 4000) {
          await ctx.reply(safe.slice(i, i + 4000), {
            parse_mode: "Markdown",
            reply_parameters: { message_id: ctx.message.message_id },
          });
        }
      } else {
        await ctx.reply(safe, {
          parse_mode: "Markdown",
          reply_parameters: { message_id: ctx.message.message_id },
        });
      }
      await addConversationMessage(tid, "user", `[Media] ${cleanText}`);
      await addConversationMessage(tid, "assistant", reply);
    } catch (e) {
      console.error("group media handler error:", e);
      return next();
    }
  });
}
