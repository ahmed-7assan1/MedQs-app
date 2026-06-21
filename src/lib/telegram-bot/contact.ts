import { Telegraf, Context } from "telegraf";
import { prisma } from "@/lib/prisma";
import { getBotUser, getLinkedUser } from "./helpers";
import { mainGuestKeyboard, mainMenuKeyboard, cancelKeyboard } from "./keyboards";

const SUPPORT_CHAT_ID = process.env.SUPPORT_TELEGRAM_CHAT_ID || "0";
const SUPPORT_NUMBER = "+201093510425";

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

export function registerContact(bot: Telegraf) {
  bot.action("contact", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);

      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: { awaiting: "contact_message" } },
      });

      const name = linked?.name ?? ctx.from?.first_name ?? "User";
      await ctx.editMessageText(
        `📞 *Contact Support*\n\nWe're here to help! Please describe your issue or question below.\n\nYour message will be forwarded to our support team and we'll get back to you as soon as possible.`,
        { parse_mode: "Markdown", reply_markup: cancelKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("contact action error:", e);
    }
  });

  bot.use(async (ctx, next) => {
    try {
      const tid = safeCtx(ctx);
      if (!ctx.message || !("text" in ctx.message)) return next();

      const botUser = await getBotUser(tid);
      const tempData = botUser?.tempData as Record<string, unknown> | null;
      if (!tempData?.awaiting || tempData.awaiting !== "contact_message") return next();

      const messageText = (ctx.message as any).text?.trim();
      if (!messageText || messageText.startsWith("/")) return next();

      const linked = await getLinkedUser(tid);
      const userName = linked?.name ?? ctx.from?.first_name ?? "Unknown";
      const userEmail = linked?.email ?? "N/A";
      const userTelegram = `@${ctx.from?.username ?? tid}`;

      const supportMsg =
        `📩 *New Contact Request*\n\n` +
        `*From:* ${userName}\n` +
        `*Telegram:* ${userTelegram}\n` +
        `*Email:* ${userEmail}\n` +
        `*User ID:* \`${tid}\`\n` +
        `*Linked Account:* ${linked ? "✅ Yes" : "❌ No"}\n\n` +
        `*Message:*\n${messageText}`;

      try {
        if (SUPPORT_CHAT_ID && SUPPORT_CHAT_ID !== "0") {
          await ctx.telegram.sendMessage(SUPPORT_CHAT_ID, supportMsg, { parse_mode: "Markdown" });
        } else {
          console.log("[Contact Support] SUPPORT_TELEGRAM_CHAT_ID not set. Message would be forwarded to:", SUPPORT_NUMBER);
          console.log("[Contact Support] Message:", supportMsg);
        }
      } catch (e) {
        console.error("Failed to forward to support chat:", e);
      }

      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: null },
      });

      const keyboard = linked ? mainMenuKeyboard() : mainGuestKeyboard();
      await ctx.reply(
        `✅ *Message Sent!*\n\nThank you, ${userName}. Your message has been forwarded to our support team.\n\nWe typically respond within 24 hours.\nFor urgent matters, please contact us directly on WhatsApp: ${SUPPORT_NUMBER}`,
        { parse_mode: "Markdown", reply_markup: keyboard.reply_markup }
      );
      return;
    } catch (e) {
      console.error("contact text handler error:", e);
      return next();
    }
  });
}
