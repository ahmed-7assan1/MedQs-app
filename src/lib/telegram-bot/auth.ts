import { Telegraf, Context } from "telegraf";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getBotUser, getLinkedUser } from "./helpers";
import { mainMenuKeyboard, mainGuestKeyboard, cancelKeyboard, confirmLogoutKeyboard, backKeyboard } from "./keyboards";

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

export function registerAuth(bot: Telegraf) {
  bot.action("auth_login_start", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const existing = await getLinkedUser(tid);
      if (existing) {
        await ctx.editMessageText(
          `✅ *You are already signed in*\n\nWelcome back, *${existing.name}*!\nUniversity: ${existing.university?.name ?? "N/A"}\nSemester: ${existing.semester?.name ?? "N/A"}\n\nUse the main menu below.`,
          { parse_mode: "Markdown", reply_markup: mainMenuKeyboard().reply_markup }
        );
        return;
      }
      const botUser = await getBotUser(tid);
      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: { awaiting: "login_email" } },
      });
      await ctx.editMessageText(
        "🔑 *Sign In*\n\nPlease enter your registered *email address*:",
        { parse_mode: "Markdown", reply_markup: cancelKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("auth_login_start error:", e);
    }
  });

  bot.action("auth_register", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "📝 *Register*\n\nPlease visit the MedOneX app to create an account:\nhttps://medqs.app\n\nAfter registering, come back and tap *Sign In* to link your Telegram account.",
        {
          parse_mode: "Markdown",
          reply_markup: mainGuestKeyboard().reply_markup,
        }
      );
    } catch (e) {
      console.error("auth_register error:", e);
    }
  });

  bot.action("confirm_logout", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.editMessageText("You are not signed in.", { reply_markup: mainGuestKeyboard().reply_markup });
        return;
      }
      await ctx.editMessageText(
        "🚪 *Confirm Logout*\n\nAre you sure you want to disconnect your Telegram account from MedOneX?\n\nThis will keep your account data safe on the platform.",
        {
          parse_mode: "Markdown",
          reply_markup: confirmLogoutKeyboard().reply_markup,
        }
      );
    } catch (e) {
      console.error("confirm_logout error:", e);
    }
  });

  bot.action("logout", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      await (prisma.user as any).updateMany({
        where: { telegramId: tid },
        data: { telegramId: null, telegramVerified: false },
      });
      await (prisma as any).botUser.update({
        where: { telegramId: tid },
        data: { tempData: null },
      });
      await ctx.editMessageText(
        "✅ *You have been logged out.*\n\nYour Telegram account is no longer linked to MedOneX.\nYou can sign in again anytime.",
        { parse_mode: "Markdown", reply_markup: mainGuestKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("logout error:", e);
    }
  });

  bot.action("settings", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);
      if (!linked) {
        await ctx.editMessageText("Please sign in to access settings.", { reply_markup: mainGuestKeyboard().reply_markup });
        return;
      }
      await ctx.editMessageText(
        `⚙ *Settings*\n\nAccount: *${linked.name}*\n${linked.email ? `Email: \`${linked.email}\`` : ""}`,
        { parse_mode: "Markdown", reply_markup: mainMenuKeyboard().reply_markup }
      );
    } catch (e) {
      console.error("settings action error:", e);
    }
  });

  bot.action("back_main", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const tid = safeCtx(ctx);
      const linked = await getLinkedUser(tid);
      if (linked) {
        await ctx.editMessageText(
          `🏠 *Main Menu*\n\nWelcome, *${linked.name}* 👋`,
          { parse_mode: "Markdown", reply_markup: mainMenuKeyboard().reply_markup }
        );
      } else {
        await ctx.editMessageText(
          "🏠 *MedOneX Bot*\n\nYour AI-powered medical study assistant.\nGet instant answers, browse modules, and more.",
          { parse_mode: "Markdown", reply_markup: mainGuestKeyboard().reply_markup }
        );
      }
    } catch (e) {
      console.error("back_main error:", e);
    }
  });

  bot.on("text", async (ctx, next) => {
    try {
      const tid = safeCtx(ctx);
      const botUser = await getBotUser(tid);
      const tempData = botUser.tempData as Record<string, unknown> | null;

      if (!tempData?.awaiting) return next();

      if (tempData.awaiting === "login_email") {
        const email = (ctx.message as any).text?.trim().toLowerCase();
        if (!email || !/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(email)) {
          await ctx.reply("❌ Invalid email format. Please enter a valid email:", { reply_markup: cancelKeyboard().reply_markup });
          return;
        }
        const existing = await getLinkedUser(tid);
        if (existing) {
          await (prisma as any).botUser.update({ where: { telegramId: tid }, data: { tempData: null } });
          await ctx.reply("✅ You are already signed in!", { reply_markup: mainMenuKeyboard().reply_markup });
          return;
        }
        const user = await (prisma.user as any).findUnique({ where: { email } });
        if (!user) {
          await ctx.reply("❌ No account found with that email. Please check or register first.", { reply_markup: cancelKeyboard().reply_markup });
          return;
        }
        await (prisma as any).botUser.update({
          where: { telegramId: tid },
          data: { tempData: { awaiting: "login_password", email, userId: user.id } },
        });
        await ctx.reply("🔑 Please enter your *password*:", { parse_mode: "Markdown", reply_markup: cancelKeyboard().reply_markup });
        return;
      }

      if (tempData.awaiting === "login_password") {
        const password = (ctx.message as any).text?.trim();
        const email = tempData.email as string;
        const userId = tempData.userId as string;

        if (!password || !email || !userId) {
          await (prisma as any).botUser.update({ where: { telegramId: tid }, data: { tempData: null } });
          await ctx.reply("❌ Session expired. Please try again.", { reply_markup: mainGuestKeyboard().reply_markup });
          return;
        }

        try {
          const user = await (prisma.user as any).findUnique({ where: { id: userId } });
          if (!user || !user.password) {
            await (prisma as any).botUser.update({ where: { telegramId: tid }, data: { tempData: null } });
            await ctx.reply("❌ Account not found or no password set. Try Google Sign In instead.", { reply_markup: mainGuestKeyboard().reply_markup });
            return;
          }

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            await ctx.reply("❌ Incorrect password. Please try again:", { reply_markup: cancelKeyboard().reply_markup });
            return;
          }

          const existingConflict = await (prisma.user as any).findFirst({
            where: { telegramId: tid, id: { not: userId } },
          });
          if (existingConflict) {
            await (prisma as any).botUser.update({ where: { telegramId: tid }, data: { tempData: null } });
            await ctx.reply("⚠️ Another account is already linked to this Telegram. Please log out first.", { reply_markup: mainGuestKeyboard().reply_markup });
            return;
          }

          await (prisma.user as any).update({
            where: { id: userId },
            data: { telegramId: tid, telegramVerified: true },
          });
          await (prisma as any).botUser.update({
            where: { telegramId: tid },
            data: { tempData: null },
          });
          await ctx.reply(
            `✅ *Sign In Successful!*\n\nWelcome, *${user.name}* 🎉`,
            { parse_mode: "Markdown", reply_markup: mainMenuKeyboard().reply_markup }
          );
        } finally {
          // Clear password reference from memory
          (password as any) = undefined;
        }
        return;
      }

      return next();
    } catch (e: any) {
      if (e?.code === "P2002") {
        try {
          await ctx.reply("⚠️ This Telegram account is already linked. Please /start to continue.");
        } catch (_) { }
        return;
      }
      console.error("auth text handler error:", e);
      try {
        await ctx.reply("❌ An error occurred. Please try /start.");
      } catch (_) { }
    }
  });
}
