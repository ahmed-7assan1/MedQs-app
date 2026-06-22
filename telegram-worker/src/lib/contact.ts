import { Telegraf, Context } from "telegraf";
import { getBotState, getLinkedUser, updateBotState } from "./helpers";
import { mainGuestKeyboard, mainMenuKeyboard, cancelKeyboard } from "./keyboards";

const SUPPORT_NUMBER = "+201093510425";

export function registerContact(bot: Telegraf, env: Record<string, string | undefined>) {
  const supportChatId = env.SUPPORT_TELEGRAM_CHAT_ID || "0";

  bot.action("contact", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = ctx.from!.id.toString();
      await updateBotState(tid, { chatState: "CONTACT_MESSAGE" });
      await ctx.editMessageText(
        `📞 *Contact Support*\n\nDescribe your issue below. Your message will be forwarded to our team.`,
        { parse_mode: "Markdown", ...cancelKeyboard() }
      );
    } catch (e: any) {
      console.error("contact action error:", e);
      try { await ctx.answerCbQuery(`⚠️ ${e.message}`.slice(0, 200)); } catch (_) {}
    }
  });

  bot.on("text", async (ctx, next) => {
    try {
      const tid = ctx.from!.id.toString();
      if (!ctx.message || !("text" in ctx.message)) return next();

      const state = await getBotState(tid);
      if (state.chatState !== "CONTACT_MESSAGE") return next();

      const messageText = (ctx.message as any).text?.trim();
      if (!messageText || messageText.startsWith("/")) return next();

      const linked = await getLinkedUser(tid);
      const userName = linked?.name ?? ctx.from?.first_name ?? "Unknown";
      const userTelegram = `@${ctx.from?.username ?? tid}`;

      const supportMsg =
        `📩 *New Contact Request*\n\n` +
        `*From:* ${userName}\n` +
        `*Telegram:* ${userTelegram}\n` +
        `*Email:* ${linked?.email ?? "N/A"}\n` +
        `*User ID:* \`${tid}\`\n` +
        `*Linked:* ${linked ? "✅" : "❌"}\n\n` +
        `*Message:*\n${messageText}`;

      if (supportChatId && supportChatId !== "0") {
        try {
          await ctx.telegram.sendMessage(supportChatId, supportMsg, { parse_mode: "Markdown" });
        } catch (e) {
          console.error("Failed to forward to support:", e);
        }
      } else {
        console.log("[Contact] SUPPORT_TELEGRAM_CHAT_ID not set. Would forward to:", SUPPORT_NUMBER);
        console.log("[Contact] Message:", supportMsg);
      }

      await updateBotState(tid, { chatState: "IDLE" });
      const keyboard = linked ? mainMenuKeyboard() : mainGuestKeyboard();
      await ctx.reply(
        `✅ *Message Sent!*\n\nThank you, ${userName}. We'll get back to you within 24 hours.\nUrgent? Contact us on WhatsApp: ${SUPPORT_NUMBER}`,
        { parse_mode: "Markdown", ...keyboard }
      );
      return;
    } catch (e: any) {
      console.error("contact text handler error:", e);
      try { await ctx.reply("❌ An error occurred. Please try again."); } catch (_) {}
    }
  });
}
