import { Telegraf, Context } from "telegraf";
import { prisma } from "@/lib/prisma";
import { getBotUser, getLinkedUser, getSystemPromptForUser, getUserApiKeys, type ProviderKey } from "./helpers";
import { groupMentionKeyboard } from "./keyboards";

const GROUP_AI_PROVIDER = "gemini";
const GROUP_AI_MODEL = "gemini-2.0-flash";

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

function isGroupChat(ctx: Context): boolean {
  const chat = ctx.chat;
  return chat?.type === "group" || chat?.type === "supergroup";
}

function isBotMentioned(ctx: Context): boolean {
  const msg = ctx.message as any;
  if (!msg?.text && !msg?.caption) return false;
  const text = msg.text || msg.caption;
  return (
    text.includes("@medonexbot") ||
    text.includes("@MedOneXBot") ||
    text.includes("@medOneXBot")
  );
}

export function registerGroup(bot: Telegraf) {
  bot.on("text", async (ctx, next) => {
    try {
      if (!isGroupChat(ctx)) return next();
      if (!isBotMentioned(ctx)) return next();

      const messageText = ((ctx.message as any).text ?? "").trim();
      const cleanText = messageText
        .replace(/@medonexbot/gi, "")
        .replace(/@MedOneXBot/gi, "")
        .trim();

      if (!cleanText) {
        const tid = safeCtx(ctx);
        const linked = await getLinkedUser(tid);
        const greeting = linked
          ? `👋 Hi *${linked.name}*! I'm MedOneX AI assistant.\n\nWhat can I help you with?`
          : "👋 Hi! I'm *MedOneX AI assistant*.\n\nChoose an option below or ask me a question directly!";

        await ctx.reply(greeting, {
          parse_mode: "Markdown",
          reply_markup: groupMentionKeyboard().reply_markup,
          reply_parameters: { message_id: ctx.message.message_id },
        });
        return;
      }

      await ctx.sendChatAction("typing");

      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);

      const systemPrompt = getSystemPromptForUser(linked);
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanText },
      ];

      let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      let provider = GROUP_AI_PROVIDER;
      let model = GROUP_AI_MODEL;

      if (linked) {
        const keys = getUserApiKeys(linked);
        const userProvider = (await getBotUser(tid))?.preferredProvider ?? GROUP_AI_PROVIDER;

        if (keys[userProvider as ProviderKey]) {
          apiKey = keys[userProvider as ProviderKey] ?? undefined;
          provider = userProvider;
          const providerModels: Record<string, string> = {
            gemini: "gemini-2.5-flash-lite",
            groq: "llama-3.3-70b-versatile",
            openrouter: "openrouter/free",
            siliconflow: "deepseek-ai/DeepSeek-V3",
          };
          model = providerModels[userProvider] || GROUP_AI_MODEL;
        } else {
          for (const [p, k] of Object.entries(keys)) {
            if (k) {
              apiKey = k;
              provider = p;
              break;
            }
          }
        }
      }

      if (!apiKey) {
        await ctx.reply(
          "❌ AI service is not available right now. Please try again later or contact support.",
          { reply_parameters: { message_id: ctx.message.message_id } }
        );
        return;
      }

      try {
        const reply = await callGroupAI(provider, apiKey, model, messages);
        if (reply.length > 4000) {
          const parts = splitMessage(reply, 4000);
          for (const part of parts) {
            await ctx.reply(part, {
              parse_mode: "Markdown",
              reply_parameters: { message_id: ctx.message.message_id },
            });
          }
        } else {
          await ctx.reply(reply, {
            parse_mode: "Markdown",
            reply_parameters: { message_id: ctx.message.message_id },
          });
        }
      } catch (e: any) {
        console.error("[Group AI] Error:", e.message);
        if (linked) {
          const keys = getUserApiKeys(linked);
          for (const [fallbackP, fallbackK] of Object.entries(keys)) {
            if (!fallbackK || fallbackP === provider) continue;
            try {
              const fbModels: Record<string, string> = {
                gemini: "gemini-2.5-flash-lite",
                groq: "llama-3.3-70b-versatile",
              };
              const fbReply = await callGroupAI(fallbackP, fallbackK, fbModels[fallbackP] || GROUP_AI_MODEL, messages);
              await ctx.reply(fbReply, {
                parse_mode: "Markdown",
                reply_parameters: { message_id: ctx.message.message_id },
              });
              return;
            } catch (_) { }
          }
        }
        await ctx.reply("❌ Sorry, I couldn't process that request. Please try again.", {
          reply_parameters: { message_id: ctx.message.message_id },
        });
      }
      return;
    } catch (e) {
      console.error("group text handler error:", e);
      return next();
    }
  });
}

async function callGroupAI(
  provider: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Gemini error");
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "❌ No response.";
    }

    if (provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Groq error");
      return data?.choices?.[0]?.message?.content ?? "❌ No response.";
    }

    const baseURLs: Record<string, string> = {
      openrouter: "https://openrouter.ai/api/v1",
      siliconflow: "https://api.siliconflow.cn/v1",
    };
    const url = `${baseURLs[provider] || "https://api.openai.com/v1"}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "API error");
    return data?.choices?.[0]?.message?.content ?? "❌ No response.";
  } catch (e: any) {
    console.error(`[callGroupAI] ${provider}:`, e.message);
    throw e;
  }
}

function splitMessage(text: string, maxBytes: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += maxBytes) {
    parts.push(text.slice(i, i + maxBytes));
  }
  return parts;
}
