import { Telegraf, Context } from "telegraf";
import {
  getLinkedUser, getBotState, getUserApiKeys, downloadTelegramFile,
  getConversationHistory, addConversationMessage,
  type ProviderKey, type LinkedUser,
} from "./helpers";
import { mainGuestKeyboard, mainMenuKeyboard, cancelKeyboard } from "./keyboards";

const SYSTEM_PROMPT = `You are Dr. Q, a friendly and warm AI medical tutor for MedOneX.
Instructions:
- Be kind, encouraging, and supportive. Use a friendly tone like a helpful senior colleague.
- Respond concisely and professionally in Telegram Markdown.
- Use emojis naturally to make responses warm and engaging (✅ 🏥 📚 💊 🩺 etc).
- You are fully bilingual in Arabic and English — match the user's language.
- Use bold for medical terms.
- If explaining procedures, use bullet points.
- Scope: Medicine, Clinical Reasoning, and Study Skills only.
- If asked who created you or founded MedOneX: "Dr. Ahmed Mohamed Hassan (د. أحمد محمد حسان) — a medical student and software engineer."
- Founder LinkedIn: https://www.linkedin.com/in/a7medm7assan
- Contact WhatsApp: +201093510425`;

const PROVIDER_MODELS: Record<string, { model: string; baseURL: string }> = {
  gemini: { model: "gemini-2.0-flash", baseURL: "https://generativelanguage.googleapis.com" },
  groq: { model: "llama-3.3-70b-versatile", baseURL: "https://api.groq.com/openai/v1" },
  openrouter: { model: "openrouter/free", baseURL: "https://openrouter.ai/api/v1" },
  siliconflow: { model: "deepseek-ai/DeepSeek-V3", baseURL: "https://api.siliconflow.cn/v1" },
  duckduckgo: { model: "gpt-4o-mini", baseURL: "https://duckduckgo.com/duckchat/v1" },
  deepseek: { model: "deepseek-chat", baseURL: "https://api.deepseek.com/chat/completions" },
  xai: { model: "grok-2", baseURL: "https://api.x.ai/v1" },
  huggingface: { model: "meta-llama/Llama-3.3-70B-Instruct", baseURL: "https://api-inference.huggingface.co/v1" },
  mistral: { model: "mistral-large-latest", baseURL: "https://api.mistral.ai/v1" },
};

async function callAI(
  provider: string,
  apiKey: string,
  model: string,
  baseURL: string,
  messages: { role: string; content: string }[],
  media?: { data: string; mimeType: string }
): Promise<string> {
  if (provider === "gemini") {
    const url = `${baseURL}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    if (media) {
      const last = contents[contents.length - 1];
      last.parts.push({ inlineData: { mimeType: media.mimeType, data: media.data } });
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "Gemini error");
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "❌ No response.";
  }

  if (provider === "duckduckgo") {
    const vqdRes = await fetch("https://duckduckgo.com/duckchat/v1/status", {
      headers: { "x-vqd-accept": "1" },
    });
    const vqd = vqdRes.headers.get("x-vqd-4") || vqdRes.headers.get("x-vqd-accept");
    if (!vqd) throw new Error("Could not negotiate VQD from DuckDuckGo.");
    const res = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vqd-4": vqd },
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) throw new Error(`DuckDuckGo error: ${res.statusText}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body from DuckDuckGo");
    let fullText = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const content = line.substring(6);
          if (content === "[DONE]") break;
          try {
            const parsed = JSON.parse(content);
            if (parsed.message) fullText += parsed.message;
          } catch {}
        }
      }
    }
    return fullText || "❌ No response from DuckDuckGo.";
  }

  const url = `${baseURL.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "API error");
  return data?.choices?.[0]?.message?.content ?? "❌ No response.";
}

export async function generateAIReply(
  user: LinkedUser | null,
  message: string,
  preferredProvider: string,
  envKeys: Record<string, string>,
  media?: { data: string; mimeType: string },
  history?: { role: string; content: string }[]
): Promise<string> {
  let provider = preferredProvider || "gemini";
  let apiKey: string | null = null;
  let model = PROVIDER_MODELS.gemini.model;
  let baseURL = PROVIDER_MODELS.gemini.baseURL;

  if (user) {
    const keys = getUserApiKeys(user);
    const cfg = PROVIDER_MODELS[provider];
    if (cfg && keys[provider as ProviderKey]) {
      apiKey = keys[provider as ProviderKey];
      model = cfg.model;
      baseURL = cfg.baseURL;
    } else {
      for (const [p, c] of Object.entries(PROVIDER_MODELS)) {
        if (keys[p as ProviderKey]) {
          provider = p;
          apiKey = keys[p as ProviderKey];
          model = c.model;
          baseURL = c.baseURL;
          break;
        }
      }
    }
  }

  if (!apiKey) {
    if (provider === "duckduckgo") {
      model = PROVIDER_MODELS.duckduckgo.model;
      baseURL = PROVIDER_MODELS.duckduckgo.baseURL;
    } else {
      const cfg = PROVIDER_MODELS[provider];
      if (cfg && envKeys[provider]) {
        apiKey = envKeys[provider];
        model = cfg.model;
        baseURL = cfg.baseURL;
      } else {
        for (const p of Object.keys(PROVIDER_MODELS)) {
          if (p === "duckduckgo") continue;
          const ek = envKeys[p];
          if (!ek) continue;
          provider = p;
          apiKey = ek;
          model = PROVIDER_MODELS[p].model;
          baseURL = PROVIDER_MODELS[p].baseURL;
          break;
        }
        if (!apiKey) {
          provider = "duckduckgo";
          model = PROVIDER_MODELS.duckduckgo.model;
          baseURL = PROVIDER_MODELS.duckduckgo.baseURL;
        }
      }
    }
  }

  if (!apiKey) {
    return "❌ No API key available. Please set a key in Settings or sign in.";
  }

  const userContext = user
    ? `[USER: Dr. ${user.name} | Uni: ${user.university_name || "N/A"} | Faculty: ${user.faculty_name || "N/A"} | Year: ${user.academic_year || "N/A"} | Semester: ${user.semester_name || "N/A"}]`
    : "";
  let basePrompt = user
    ? `${SYSTEM_PROMPT}\n\n${userContext}`
    : `${SYSTEM_PROMPT}`;
  if (history && history.length > 0) {
    basePrompt += "\n\n### Conversation History:";
    for (const h of history) {
      basePrompt += `\n${h.role === "user" ? "User" : "Assistant"}: ${h.content}`;
    }
    basePrompt += "\n\n### Current Message:";
  }
  const fullPrompt = `${basePrompt}\n\n${message}`;
  const messages = [{ role: "user", content: fullPrompt }];

  try {
    return await callAI(provider, apiKey, model, baseURL, messages, media);
  } catch (e: any) {
    console.error(`[AI] ${provider} failed:`, e.message);
    if (user) {
      const keys = getUserApiKeys(user);
      for (const [fp, fc] of Object.entries(PROVIDER_MODELS)) {
        if (fp === provider) continue;
        const fk = keys[fp as ProviderKey];
        if (!fk) continue;
        try {
          return await callAI(fp, fk, fc.model, fc.baseURL, messages, media);
        } catch (_) {
          continue;
        }
      }
    }
    for (const p of Object.keys(PROVIDER_MODELS)) {
      if (p === "duckduckgo") continue;
      const ek = envKeys[p];
      if (!ek) continue;
      try {
        return await callAI(p, ek, PROVIDER_MODELS[p].model, PROVIDER_MODELS[p].baseURL, messages, media);
      } catch (_) {}
    }
    try {
      return await callAI("duckduckgo", "", PROVIDER_MODELS.duckduckgo.model, PROVIDER_MODELS.duckduckgo.baseURL, messages, media);
    } catch (_) {}
    return "❌ No response from AI. Please check your keys or try again.";
  }
}

export function registerAI(bot: Telegraf, env: Record<string, string | undefined>) {
  const envKeys: Record<string, string> = { duckduckgo: "free" };
  for (const p of Object.keys(PROVIDER_MODELS)) {
    if (p === "duckduckgo") continue;
    const keyVar = `${p.toUpperCase()}_API_KEY`;
    if (env[keyVar]) envKeys[p] = env[keyVar]!;
  }
  const extraGemini = [env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4].filter((k): k is string => !!k);
  const allGeminiKeys = envKeys.gemini ? [envKeys.gemini, ...extraGemini] : extraGemini;

  bot.action("ai_chat", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.editMessageText("🔑 *Sign In Required*\n\nPlease sign in to use AI Chat with your personal API keys, or try free mode.", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Sign In", callback_data: "auth_login_start" }],
              [{ text: "💬 Try Free AI", callback_data: "ai_guest" }],
            ],
          },
        });
        return;
      }
      await updateBotState(tid, { chatState: "AI_CHAT", tempData: null });
      await ctx.editMessageText(
        "🤖 *AI Chat*\n\nI'm your medical study assistant. Send me your question:",
        { parse_mode: "Markdown", ...cancelKeyboard() }
      );
    } catch (e: any) {
      console.error("ai_chat error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.action("ai_guest", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      await updateBotState(tid, { chatState: "AI_CHAT_GUEST", tempData: null });
      await ctx.editMessageText(
        "🤖 *AI Chat (Free)*\n\nLimited capability. Sign in for your API keys!\n\nSend your question:",
        { parse_mode: "Markdown", ...cancelKeyboard() }
      );
    } catch (e: any) {
      console.error("ai_guest error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.on("text", async (ctx, next) => {
    try {
      const tid = ctx.from!.id.toString();
      if (!ctx.message || !("text" in ctx.message)) return next();

      const state = await getBotState(tid);
      if (!state.chatState || !["AI_CHAT", "AI_CHAT_GUEST", "AI_GROUP"].includes(state.chatState)) return next();

      const messageText = (ctx.message as any).text?.trim();
      if (!messageText || messageText.startsWith("/")) return next();

      await ctx.sendChatAction("typing");

      const linked = await getLinkedUser(tid);
      const isGuest = state.chatState === "AI_CHAT_GUEST";
      const history = await getConversationHistory(tid);

      try {
        let reply = await generateAIReply(isGuest ? null : linked, messageText, state.provider, envKeys, undefined, history);
        if (reply.startsWith("❌") && allGeminiKeys.length > 1) {
          for (const gk of allGeminiKeys) {
            try {
              const retry = await callAI("gemini", gk, PROVIDER_MODELS.gemini.model, PROVIDER_MODELS.gemini.baseURL, [{ role: "user", content: messageText }]);
              if (retry) { reply = retry; break; }
            } catch (_) {}
          }
        }
        if (reply.length > 4000) {
          for (let i = 0; i < reply.length; i += 4000) {
            await ctx.reply(escapeMarkdown(reply.slice(i, i + 4000)), { parse_mode: "Markdown" });
          }
        } else {
          await ctx.reply(escapeMarkdown(reply), { parse_mode: "Markdown" });
        }
        await addConversationMessage(tid, "user", messageText);
        await addConversationMessage(tid, "assistant", reply);
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

  bot.on(["photo", "document"], async (ctx, next) => {
    try {
      const tid = ctx.from!.id.toString();
      const state = await getBotState(tid);
      if (!state.chatState || !["AI_CHAT", "AI_CHAT_GUEST"].includes(state.chatState)) return next();

      const msg = ctx.message as any;
      let fileId: string | undefined;
      let caption = (msg.caption || "").trim();

      if (msg.photo) {
        fileId = msg.photo[msg.photo.length - 1].file_id;
        caption = caption || "Analyze this image from a medical perspective.";
      } else if (msg.document) {
        const mime = msg.document.mime_type || "";
        if (!mime.startsWith("image/")) return next();
        fileId = msg.document.file_id;
        caption = caption || "Analyze this image.";
      }

      if (!fileId || !env.TELEGRAM_BOT_TOKEN) return next();

      await ctx.sendChatAction("typing");

      const media = await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN, fileId);
      if (!media) {
        await ctx.reply("❌ Could not download the file. Try again.");
        return;
      }

      const linked = await getLinkedUser(tid);
      const isGuest = state.chatState === "AI_CHAT_GUEST";
      const history = await getConversationHistory(tid);
      const reply = await generateAIReply(isGuest ? null : linked, caption, state.provider, envKeys, media, history);

      if (reply.length > 4000) {
        for (let i = 0; i < reply.length; i += 4000) {
          await ctx.reply(escapeMarkdown(reply.slice(i, i + 4000)), { parse_mode: "Markdown" });
        }
      } else {
        await ctx.reply(escapeMarkdown(reply), { parse_mode: "Markdown" });
      }
      await addConversationMessage(tid, "user", `[Media] ${caption}`);
      await addConversationMessage(tid, "assistant", reply);
    } catch (e) {
      console.error("ai media handler error:", e);
      return next();
    }
  });
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]`~]/g, "\\$&");
}
