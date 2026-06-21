import { Telegraf, Context } from "telegraf";
import { prisma } from "@/lib/prisma";
import {
  getLinkedUser, getBotUser, getUserApiKeys, getSystemPromptForUser, type ProviderKey, type LinkedUser,
} from "./helpers";
import { mainGuestKeyboard, mainMenuKeyboard, backKeyboard } from "./keyboards";

const PROVIDER_CONFIGS: Record<string, { label: string; defaultModel: string }> = {
  gemini: { label: "Google Gemini", defaultModel: "gemini-2.5-flash-lite" },
  groq: { label: "Groq", defaultModel: "llama-3.3-70b-versatile" },
  openrouter: { label: "OpenRouter", defaultModel: "openrouter/free" },
  siliconflow: { label: "SiliconFlow", defaultModel: "deepseek-ai/DeepSeek-R1" },
  anthropic: { label: "Anthropic", defaultModel: "claude-3.5-sonnet" },
  openai: { label: "OpenAI", defaultModel: "gpt-4o-mini" },
  xai: { label: "xAI Grok", defaultModel: "grok-2" },
  huggingface: { label: "HuggingFace", defaultModel: "meta-llama/Llama-3.3-70B-Instruct" },
  mistral: { label: "Mistral AI", defaultModel: "mistral-large-latest" },
  together: { label: "Together AI", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  cloudflare: { label: "Cloudflare", defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" },
  cerebras: { label: "Cerebras", defaultModel: "llama-3.3-70b" },
  github: { label: "GitHub Models", defaultModel: "gpt-4o-mini" },
  ovhcloud: { label: "OVHcloud", defaultModel: "Meta-Llama-3_3-70B-Instruct" },
};

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

async function callProvider(payload: {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
  messages: { role: string; content: string }[];
}): Promise<string> {
  const { provider, apiKey, model, baseURL, messages } = payload;
  try {
    let url = baseURL;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: Record<string, unknown> = { model, messages };

    if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiContents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiContents }),
      });
      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) throw new Error(geminiData?.error?.message ?? "Gemini API error");
      return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "❌ No response from Gemini.";
    }

    if (provider === "cloudflare") {
      const [accountId, apiToken] = apiKey.split(":");
      url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      headers = { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" };
      const lastMsg = messages[messages.length - 1];
      body = { prompt: lastMsg.content };
      messages.slice(0, -1).forEach((m) => {
        body.prompt = `${m.role}: ${m.content}\n${body.prompt}`;
      });
    }

    if (provider === "huggingface") {
      url = `${baseURL.replace(/\/$/, "")}/chat/completions`;
    }

    if (!url.startsWith("http")) {
      url = `${baseURL.replace(/\/$/, "")}/chat/completions`;
    }

    if (!headers.Authorization && provider !== "gemini") {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    if (body.model !== model) body.model = model;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
    return data?.choices?.[0]?.message?.content ?? "❌ No response from AI.";
  } catch (e: any) {
    console.error(`[Telegram AI] ${provider} error:`, e.message);
    throw e;
  }
}

async function generateAIReply(
  user: LinkedUser | null,
  message: string,
  preferredProvider: string
): Promise<string> {
  const botUser = user ? null : null; // placeholder
  let provider = preferredProvider || "gemini";
  const systemPrompt = getSystemPromptForUser(user);

  let apiKey: string | null = null;
  let baseURL = "https://api.openai.com/v1";
  let model = "gpt-4o-mini";

  if (user) {
    const keys = getUserApiKeys(user);
    const config = PROVIDER_CONFIGS[provider];
    if (config && keys[provider as ProviderKey]) {
      apiKey = keys[provider as ProviderKey];
      baseURL = getBaseURL(provider);
      model = config.defaultModel;
    } else {
      for (const [p, cfg] of Object.entries(PROVIDER_CONFIGS)) {
        if (keys[p as ProviderKey]) {
          provider = p;
          apiKey = keys[p as ProviderKey];
          baseURL = getBaseURL(p);
          model = cfg.defaultModel;
          break;
        }
      }
    }
  }

  if (!apiKey) {
    provider = "gemini";
    apiKey = process.env.GEMINI_API_KEY!;
    model = PROVIDER_CONFIGS.gemini.defaultModel;
    baseURL = "https://generativelanguage.googleapis.com";
  }

  if (!apiKey) {
    return "❌ No API key available. Please set a key in Settings or sign in with your account.";
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];

  try {
    const reply = await callProvider({ provider, apiKey, model, baseURL, messages });
    return reply;
  } catch (e: any) {
    console.error(`[Telegram AI] Primary provider ${provider} failed:`, e.message);
    if (user) {
      const keys = getUserApiKeys(user);
      for (const [fallbackP, fbCfg] of Object.entries(PROVIDER_CONFIGS)) {
        if (fallbackP === provider) continue;
        const fbKey = keys[fallbackP as ProviderKey];
        if (!fbKey) continue;
        try {
          const fbBaseURL = getBaseURL(fallbackP);
          const reply = await callProvider({
            provider: fallbackP,
            apiKey: fbKey,
            model: fbCfg.defaultModel,
            baseURL: fbBaseURL,
            messages,
          });
          return reply;
        } catch (fbErr: any) {
          console.error(`[Telegram AI] Fallback ${fallbackP} also failed:`, fbErr.message);
          continue;
        }
      }
    }
    return "❌ No response from AI. Please check your keys or try again later.";
  }
}

function getBaseURL(provider: string): string {
  const urls: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1",
    openrouter: "https://openrouter.ai/api/v1",
    siliconflow: "https://api.siliconflow.cn/v1",
    cloudflare: "https://api.cloudflare.com/client/v4/accounts",
    huggingface: "https://api-inference.huggingface.co/v1",
    together: "https://api.together.xyz/v1",
    anthropic: "https://api.anthropic.com/v1",
    openai: "https://api.openai.com/v1",
    github: "https://models.inference.ai.azure.com",
    mistral: "https://api.mistral.ai/v1",
    cerebras: "https://api.cerebras.ai/v1",
    ovhcloud: "https://llm-api.ovhcloud.com/v1",
    gemini: "https://generativelanguage.googleapis.com",
  };
  return urls[provider] || urls.gemini;
}

export function registerAI(bot: Telegraf) {
  bot.action("ai_chat", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);
      const botUser = await getBotUser(tid);
      const provider = botUser?.preferredProvider ?? "gemini";

      if (!linked) {
        await ctx.editMessageText("Please sign in first to access AI Chat.", { reply_markup: mainGuestKeyboard().reply_markup });
        return;
      }

      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: { awaiting: "ai_message", conversation: [] } },
      });
      await ctx.editMessageText(
        `🤖 *AI Chat*\n\nI'm your medical study assistant. Ask me anything about:\n• Medical topics & concepts\n• Exam preparation\n• Clinical cases\n• Study materials\n\nSend me your question:`,
        { parse_mode: "Markdown", reply_markup: backKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("ai_chat error:", e);
    }
  });

  bot.action("ai_guest", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: { awaiting: "ai_message_guest", conversation: [] } },
      });
      await ctx.editMessageText(
        "🤖 *AI Chat (Free)*\n\nYou're using the free tier with limited capabilities.\nSign in to unlock your personal API keys for better models!\n\nSend me your question:",
        { parse_mode: "Markdown", reply_markup: backKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("ai_guest error:", e);
    }
  });

  bot.use(async (ctx, next) => {
    try {
      const tid = safeCtx(ctx);
      if (!ctx.message || !("text" in ctx.message)) return next();

      const botUser = await getBotUser(tid);
      const tempData = botUser?.tempData as Record<string, unknown> | null;
      if (!tempData?.awaiting || !["ai_message", "ai_message_guest", "ai_group"].includes(tempData.awaiting as string)) {
        return next();
      }

      const messageText = (ctx.message as any).text?.trim();
      if (!messageText || messageText.startsWith("/")) return next();

      await ctx.sendChatAction("typing");

      const linked = await getLinkedUser(tid);
      const provider = botUser?.preferredProvider ?? "gemini";
      const isGuest = tempData.awaiting === "ai_message_guest";

      let conv: { role: string; content: string }[] = (tempData.conversation as any[]) ?? [];
      conv.push({ role: "user", content: messageText });
      if (conv.length > 20) conv = conv.slice(-20);

      try {
        const reply = await generateAIReply(isGuest ? null : linked, messageText, provider);
        conv.push({ role: "assistant", content: reply });

        await (prisma as any).botUser.update({
          where: { telegramId: tid },
          data: { tempData: { ...tempData, conversation: conv } },
        });

        const MAX_LENGTH = 4000;
        if (reply.length <= MAX_LENGTH) {
          await ctx.reply(escapeMarkdown(reply), { parse_mode: "Markdown" });
        } else {
          const parts = splitMessage(reply, MAX_LENGTH);
          for (const part of parts) {
            await ctx.reply(escapeMarkdown(part), { parse_mode: "Markdown" });
          }
        }
      } catch (e: any) {
        console.error("AI generation error:", e);
        await ctx.reply("❌ Failed to generate response. Please try again.");
      }

      return;
    } catch (e) {
      console.error("ai use handler error:", e);
      return next();
    }
  });
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/`/g, "\\`")
    .replace(/~/g, "\\~");
}

function splitMessage(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.slice(i, i + maxLength));
  }
  return parts;
}
