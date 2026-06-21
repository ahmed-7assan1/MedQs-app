import { Telegraf, Context, Markup } from "telegraf";
import { prisma } from "@/lib/prisma";
import { getLinkedUser } from "./helpers";
import { mainMenuKeyboard, backKeyboard } from "./keyboards";

const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID;
const BASE_URL = process.env.NEXTAUTH_URL || "https://medqs.app";

function safeCtx(ctx: Context): string {
  return ctx.from?.id.toString() ?? "unknown";
}

export function registerModules(bot: Telegraf) {
  bot.action(/^grade\|(\d+)$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const year = parseInt(ctx.match[1]);
      const tid = safeCtx(ctx);

      const semesters = await (prisma.semester as any).findMany({
        where: { year },
        orderBy: { name: "asc" },
      });

      if (semesters.length === 0) {
        await ctx.editMessageText("❌ No semesters found for this year.", { reply_markup: backKeyboard().reply_markup });
        return;
      }

      const keyboard = Markup.inlineKeyboard([
        ...semesters.map((s: any) => [Markup.button.callback(`📖 ${s.name}`, `semester|${s.id}`)]),
        [Markup.button.callback("⬅ Back to Years", "back_years")],
        [Markup.button.callback("🏠 Main Menu", "back_main")],
      ]);

      await ctx.editMessageText(`📚 *Year ${year}*\nSelect a semester:`, {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e) {
      console.error("grade action error:", e);
    }
  });

  bot.action("back_years", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const keyboard = Markup.inlineKeyboard([
        [{ text: "🎉 First Year", callback_data: "grade|1" }],
        [{ text: "🎉 Second Year", callback_data: "grade|2" }],
        [{ text: "🎉 Third Year", callback_data: "grade|3" }],
        [{ text: "🎉 Fourth Year", callback_data: "grade|4" }],
        [{ text: "🎉 Fifth Year", callback_data: "grade|5" }],
        [{ text: "🎉 Sixth Year", callback_data: "grade|6" }],
        [{ text: "🏠 Main Menu", callback_data: "back_main" }],
      ]);
      await ctx.editMessageText("📚 *Modules*\n\nSelect a year to browse available modules:", {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard.reply_markup.inline_keyboard },
      });
    } catch (e) {
      console.error("back_years error:", e);
    }
  });

  bot.action(/^semester\|(.+)$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const semesterId = ctx.match[1];

      const modules = await (prisma.module as any).findMany({ where: { semesterId } });
      if (modules.length === 0) {
        await ctx.editMessageText("❌ No modules found for this semester.", { reply_markup: backKeyboard().reply_markup });
        return;
      }

      const keyboard = Markup.inlineKeyboard([
        ...modules.map((m: any) => [Markup.button.callback(`📦 ${m.name}`, `mod_${m.id}`)]),
        [Markup.button.callback("⬅ Back to Years", "back_years")],
      ]);

      await ctx.editMessageText("Select a Module:", {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e) {
      console.error("semester action error:", e);
    }
  });

  bot.action(/^mod_(.+)$/, async (ctx) => {
    try {
      const moduleId = ctx.match[1];
      const subjects = await (prisma.subject as any).findMany({ where: { moduleId } });
      if (subjects.length === 0) {
        await ctx.answerCbQuery("❌ No subjects in this module.");
        return;
      }
      await ctx.answerCbQuery();
      const keyboard = Markup.inlineKeyboard([
        ...subjects.map((s: any) => [Markup.button.callback(`📖 ${s.name}`, `sub_${s.id}`)]),
        [Markup.button.callback("⬅ Back", `semester|${subjects[0]?.module?.semesterId ?? ""}`)],
      ]);
      await ctx.editMessageText("Select a Subject:", {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e) {
      console.error("mod_ action error:", e);
    }
  });

  bot.action(/^sub_(.+)$/, async (ctx) => {
    try {
      const subjectId = ctx.match[1];
      const lectures = await (prisma.lecture as any).findMany({
        where: { subjectId },
        orderBy: { order: "asc" },
      });
      if (lectures.length === 0) {
        await ctx.answerCbQuery("❌ No lectures found.");
        return;
      }
      await ctx.answerCbQuery();
      const keyboard = Markup.inlineKeyboard(
        lectures.map((l: any) => [Markup.button.callback(`📝 ${l.title}`, `lec_${l.id}`)])
      );
      await ctx.editMessageText("Select a Lecture:", {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e) {
      console.error("sub_ action error:", e);
    }
  });

  bot.action(/^lec_(.+)$/, async (ctx) => {
    try {
      const lecId = ctx.match[1];
      const lec = await (prisma.lecture as any).findUnique({
        where: { id: lecId },
        include: { videos: true, records: true, files: true, questions: true, subject: true },
      });
      if (!lec) {
        await ctx.answerCbQuery("❌ Lecture not found.");
        return;
      }
      await ctx.answerCbQuery();

      let msg = `🎓 *${lec.title}*\n\n`;
      const attachments = [...(lec.files || []), ...(lec.videos || []), ...(lec.records || [])];
      if (attachments.length === 0) {
        msg += "_No files available yet._";
      } else {
        msg += `📦 *Lecture Content (${attachments.length} items):*\n`;
        for (const item of attachments) {
          msg += `• ${(item as any).name || (item as any).title}\n`;
        }
      }

      const buttons: any[][] = [];
      if (attachments.length > 0) buttons.push([Markup.button.callback("📥 Get All Files", `get_all_${lec.id}`)]);
      if (lec.questions?.length > 0) buttons.push([Markup.button.callback(`✍️ Start Quiz (${lec.questions.length})`, `quiz_${lec.id}`)]);
      buttons.push([Markup.button.callback("⬅ Back", `sub_${lec.subjectId}`)]);

      await ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      });
    } catch (e) {
      console.error("lec_ action error:", e);
    }
  });

  bot.action(/^get_all_(.+)$/, async (ctx) => {
    try {
      const lecId = ctx.match[1];
      const lec = await (prisma.lecture as any).findUnique({
        where: { id: lecId },
        include: { videos: true, records: true, files: true },
      });
      if (!lec) {
        await ctx.answerCbQuery("❌ Lecture not found.");
        return;
      }
      await ctx.answerCbQuery("Delivering files... 🚀");
      const all = [...(lec.files || []), ...(lec.videos || []), ...(lec.records || [])];

      for (const item of all) {
        const itemAny = item as any;
        let sentMessage: any = null;

        if (itemAny.telegramMessageId && itemAny.telegramChatId) {
          try {
            sentMessage = await ctx.telegram.copyMessage(ctx.from!.id, itemAny.telegramChatId, itemAny.telegramMessageId);
          } catch {
            sentMessage = await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: "Markdown" });
          }
        } else {
          sentMessage = await ctx.reply(`🔗 [${itemAny.name || itemAny.title}](${itemAny.url})`, { parse_mode: "Markdown" });
        }

        if (STORAGE_GROUP_ID && sentMessage && !itemAny.telegramChatId) {
          try {
            const forwarded = await ctx.telegram.copyMessage(STORAGE_GROUP_ID, ctx.from!.id, sentMessage.message_id, {
              message_thread_id: 1,
            });
            const modelName = itemAny.title ? "lectureVideo" : itemAny.name ? "lectureFile" : null;
            if (modelName) {
              await (prisma as any)[modelName].update({
                where: { id: itemAny.id },
                data: { telegramChatId: STORAGE_GROUP_ID.toString(), telegramMessageId: forwarded.message_id },
              }).catch(() => {});
            }
          } catch (err) {
            console.error("Storage Group Forward Error:", err);
          }
        }
      }
    } catch (e) {
      console.error("get_all_ action error:", e);
    }
  });

  bot.action(/^quiz_(.+)$/, async (ctx) => {
    try {
      const lecId = ctx.match[1];
      const questions = await (prisma.question as any).findMany({ where: { lectureId: lecId } });

      if (questions.length === 0) {
        await ctx.answerCbQuery("⚠️ No questions found.");
        return;
      }

      const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
      await ctx.answerCbQuery("Starting Quiz Batch! 📝");
      await ctx.editMessageText(
        `📝 *Starting Quiz Session*\nQuestions: ${shuffled.length}\n\n_Sending questions as native polls..._`,
        { parse_mode: "Markdown" }
      );

      for (const [i, q] of shuffled.entries()) {
        try {
          const options = q.choices as string[];
          const correctIdx = options.indexOf(q.answer);
          const questionText = `[${i + 1}/${shuffled.length}] ${q.body}`;

          if (questionText.length > 300) {
            await ctx.reply(questionText, { parse_mode: "Markdown" });
            await ctx.replyWithQuiz("☝️ Solve the question above:", options, {
              correct_option_id: correctIdx >= 0 ? correctIdx : 0,
              explanation: q.explanation || "Review the lecture material.",
              is_anonymous: false,
            });
          } else {
            await ctx.replyWithQuiz(questionText, options, {
              correct_option_id: correctIdx >= 0 ? correctIdx : 0,
              explanation: q.explanation || "Review the lecture material.",
              is_anonymous: false,
            });
          }
          await new Promise((r) => setTimeout(r, 1000));
        } catch (err: any) {
          console.error(`[BOT] Poll ${i + 1} Error:`, err?.message);
          await ctx.reply(`⚠️ Could not send poll for Q${i + 1}. Skipping...`);
        }
      }
      await ctx.reply("🏁 All questions delivered! Solve them at your own pace.");
    } catch (e) {
      console.error("quiz_ action error:", e);
    }
  });

  bot.action(/^ans_(.+)$/, (ctx) => ctx.answerCbQuery());

  bot.on(["video", "photo", "document"], async (ctx) => {
    try {
      const tid = safeCtx(ctx);
      const linkedUser = await getLinkedUser(tid);
      if (!linkedUser) return;

      const caption = ((ctx.message as any).caption || "").trim();
      const universityId = linkedUser.universityId;
      if (!universityId) return;

      const globalForum = await (prisma.forum as any).findFirst({
        where: { universityId, type: "GLOBAL" },
      });
      if (!globalForum) return;

      await ctx.reply("🔄 Processing your media for the forum... 🚀");

      let attachment: any = null;
      const msg = ctx.message as any;

      if (msg.video) {
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${msg.video.file_id}&type=video`, type: "video", fileId: msg.video.file_id };
      } else if (msg.photo) {
        const photo = msg.photo.pop();
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${photo.file_id}&type=image`, type: "image", fileId: photo.file_id };
      } else if (msg.document) {
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${msg.document.file_id}&type=document`, type: "document", fileId: msg.document.file_id, name: msg.document.file_name };
      }

      if (!attachment) return;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10);

      const post = await (prisma.post as any).create({
        data: {
          content: caption || `Sent a ${attachment.type} from Telegram`,
          authorId: linkedUser.id,
          imageUrl: attachment.url,
          forumId: globalForum.id,
          universityId,
          attachments: [attachment],
          audience: "UNIVERSITY",
          expiresAt,
          isForumPost: true,
        },
      });

      await ctx.reply(
        `✅ **Published to MedOneX Community!** 🚀\n\n🔗 [View your post here](${BASE_URL}/forum/post/${post.id})`,
        { parse_mode: "Markdown" }
      );

      if (STORAGE_GROUP_ID) {
        await ctx.telegram
          .copyMessage(STORAGE_GROUP_ID, ctx.from!.id, ctx.message.message_id, {
            caption: `Published by Dr. ${linkedUser.name} (@${ctx.from?.username || "N/A"})\nPost ID: ${post.id}`,
            message_thread_id: 1,
          })
          .catch(() => {});
      }
    } catch (e: any) {
      console.error("[BOT-MEDIA] Publishing Error:", e);
    }
  });
}
