import { Telegraf, Context, Markup } from "telegraf";
import { getLinkedUser, getSql } from "./helpers";
import { gradeKeyboard } from "./keyboards";

export function registerModules(bot: Telegraf, env: Record<string, string | undefined>) {
  const STORAGE_GROUP_ID = env.TELEGRAM_STORAGE_GROUP_ID || "";
  const BASE_URL = env.NEXTAUTH_URL || "https://medqs.app";

  bot.action(/^grade\|(\d+)$/, async (ctx) => {
    try {
      const sql = getSql();
      await ctx.answerCbQuery();
      const year = parseInt(ctx.match[1]);
      const semesters = await sql`SELECT * FROM "Semester" WHERE "year" = ${year} ORDER BY "name" ASC`;
      if (semesters.length === 0) {
        await ctx.editMessageText("❌ No semesters found.", { ...gradeKeyboard() });
        return;
      }
      const keyboard = Markup.inlineKeyboard([
        ...semesters.map((s: any) => [Markup.button.callback(`📖 ${s.name}`, `semester|${s.id}`)]),
        [Markup.button.callback("⬅ Back", "back_years")],
        [Markup.button.callback("🏠 Main Menu", "back_main")],
      ]);
      await ctx.editMessageText(`📚 *Year ${year}*\nSelect a semester:`, {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e: any) {
      console.error("grade action error:", e);
      await ctx.reply("⚠️ Error loading semesters. Please try again.").catch(() => {});
    }
  });

  bot.action("back_years", async (ctx) => {
    try {
      const sql = getSql();
      await ctx.answerCbQuery();
      await ctx.editMessageText("📚 *Modules*\n\nSelect a year:", {
        parse_mode: "Markdown",
        ...gradeKeyboard(),
      });
    } catch (e: any) {
      console.error("back_years error:", e);
      await ctx.reply("⚠️ Error. Please try again.").catch(() => {});
    }
  });

  bot.action(/^semester\|(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      await ctx.answerCbQuery();
      const semesterId = ctx.match[1];
      const modules = await sql`SELECT * FROM "Module" WHERE "semesterId" = ${semesterId}`;
      if (modules.length === 0) {
        await ctx.editMessageText("❌ No modules found.", {
          reply_markup: { inline_keyboard: [[{ text: "⬅ Back", callback_data: "back_years" }]] },
        });
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
    } catch (e: any) {
      console.error("semester action error:", e);
      await ctx.reply("⚠️ Error loading modules. Please try again.").catch(() => {});
    }
  });

  bot.action(/^mod_(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      const moduleId = ctx.match[1];
      const subjects = await sql`SELECT * FROM "Subject" WHERE "moduleId" = ${moduleId}`;
      if (subjects.length === 0) {
        await ctx.answerCbQuery("❌ No subjects.");
        return;
      }
      await ctx.answerCbQuery();
      const keyboard = Markup.inlineKeyboard([
        ...subjects.map((s: any) => [Markup.button.callback(`📖 ${s.name}`, `sub_${s.id}`)]),
        [Markup.button.callback("⬅ Back", `semester|${(subjects[0] as any).moduleId}`)],
      ]);
      await ctx.editMessageText("Select a Subject:", {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      });
    } catch (e: any) {
      console.error("mod_ error:", e);
      await ctx.reply("⚠️ Error loading subjects.").catch(() => {});
    }
  });

  bot.action(/^sub_(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      const subjectId = ctx.match[1];
      const lectures = await sql`SELECT * FROM "Lecture" WHERE "subjectId" = ${subjectId} ORDER BY "order" ASC`;
      if (lectures.length === 0) {
        await ctx.answerCbQuery("❌ No lectures.");
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
    } catch (e: any) {
      console.error("sub_ error:", e);
      await ctx.reply("⚠️ Error loading lectures.").catch(() => {});
    }
  });

  bot.action(/^lec_(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      const lecId = ctx.match[1];
      const [[lec], vids, files, questions] = await Promise.all([
        sql`SELECT * FROM "Lecture" WHERE "id" = ${lecId}`,
        sql`SELECT * FROM "LectureVideo" WHERE "lectureId" = ${lecId}`,
        sql`SELECT * FROM "LectureFile" WHERE "lectureId" = ${lecId}`,
        sql`SELECT * FROM "Question" WHERE "lectureId" = ${lecId}`,
      ]);
      if (!lec) { await ctx.answerCbQuery("❌ Not found."); return; }
      await ctx.answerCbQuery();
      const attachments = [...vids, ...files];

      let msg = `🎓 *${lec.title}*\n\n`;
      msg += attachments.length === 0
        ? "_No files available._"
        : `📦 *${attachments.length} items*\n` + attachments.map((a: any) => `• ${a.name || a.title}`).join("\n");

      const buttons: any[][] = [];
      if (attachments.length > 0) buttons.push([Markup.button.callback("📥 Get All Files", `get_all_${lec.id}`)]);
      if (questions.length > 0) buttons.push([Markup.button.callback(`✍️ Quiz (${questions.length})`, `quiz_${lec.id}`)]);
      buttons.push([Markup.button.callback("⬅ Back", `sub_${lec.subjectId}`)]);

      await ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      });
    } catch (e: any) {
      console.error("lec_ error:", e);
      await ctx.reply("⚠️ Error loading lecture details.").catch(() => {});
    }
  });

  bot.action(/^get_all_(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      const lecId = ctx.match[1];
      await ctx.answerCbQuery("Delivering... 🚀");
      const [vids, files] = await Promise.all([
        sql`SELECT * FROM "LectureVideo" WHERE "lectureId" = ${lecId}`,
        sql`SELECT * FROM "LectureFile" WHERE "lectureId" = ${lecId}`,
      ]);
      const all = [...vids, ...files];

      for (const item of all) {
        const i = item as any;
        if (i.telegramMessageId && i.telegramChatId && STORAGE_GROUP_ID) {
          try {
            await ctx.telegram.copyMessage(ctx.from!.id, STORAGE_GROUP_ID, parseInt(i.telegramMessageId));
            continue;
          } catch (_) {}
        }
        await ctx.reply(`🔗 [${i.name || i.title}](${i.url})`, { parse_mode: "Markdown" });
      }
    } catch (e: any) {
      console.error("get_all_ error:", e);
      await ctx.reply("⚠️ Error delivering files.").catch(() => {});
    }
  });

  bot.action(/^quiz_(.+)$/, async (ctx) => {
    try {
      const sql = getSql();
      const lecId = ctx.match[1];
      const questions = await sql`SELECT * FROM "Question" WHERE "lectureId" = ${lecId} LIMIT 10`;
      if (questions.length === 0) { await ctx.answerCbQuery("❌ No questions."); return; }

      await ctx.answerCbQuery("Starting Quiz! 📝");
      const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 5);

      for (const [i, q] of shuffled.entries()) {
        try {
          const choices = typeof q.choices === "string" ? JSON.parse(q.choices) : q.choices;
          let options: string[] = [];
          let correctIdx = 0;

          if (Array.isArray(choices)) {
            if (choices[0] && typeof choices[0] === "object" && "text" in choices[0]) {
              options = choices.map((c: any) => c.text);
              correctIdx = choices.findIndex((c: any) =>
                c.key === q.answer || c.text === q.answer
              );
            } else {
              options = choices;
              correctIdx = options.indexOf(q.answer);
            }
          }
          if (options.length < 2) continue;
          if (correctIdx < 0) correctIdx = 0;

          const safeBody = q.body?.length > 250 ? q.body.substring(0, 250) + "…" : q.body;
          const safeOpts = options.map((o: string) => o.length > 100 ? o.substring(0, 97) + "…" : o);
          const safeExpl = (q.explanation || q.aiExplanation || "").substring(0, 195);

          await ctx.replyWithQuiz(safeBody, safeOpts, {
            correct_option_id: correctIdx,
            explanation: safeExpl || undefined,
            is_anonymous: false,
          });
          await new Promise(r => setTimeout(r, 1200));
        } catch (err) {
          console.error(`Quiz Q${i + 1} error:`, err);
        }
      }
      await ctx.reply("🏁 Done! Solve at your own pace.");
    } catch (e: any) {
      console.error("quiz_ error:", e);
      await ctx.reply("⚠️ Error starting quiz.").catch(() => {});
    }
  });

  bot.action(/^ans_(.+)$/, (ctx) => ctx.answerCbQuery());

  bot.on(["video", "photo", "document"], async (ctx) => {
    try {
      const sql = getSql();
      const tid = ctx.from!.id.toString();
      const linked = await getLinkedUser(tid);
      if (!linked?.universityId) return;

      const [forum] = await sql`
        SELECT id FROM "Forum" WHERE "universityId" = ${linked.universityId} AND "type" = 'GLOBAL' LIMIT 1
      `;
      if (!forum) return;

      await ctx.reply("🔄 Publishing to community...");

      const msg = ctx.message as any;
      let attachment: any = { type: "document" };
      if (msg.video) {
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${msg.video.file_id}&type=video`, type: "video" };
      } else if (msg.photo) {
        const photo = msg.photo.pop();
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${photo.file_id}&type=image`, type: "image" };
      } else if (msg.document) {
        attachment = { url: `/api/v1/files/telegram/preview?fileId=${msg.document.file_id}&type=document`, type: "document" };
      }

      const caption = (msg.caption || "").trim();
      const expiresAt = new Date(Date.now() + 10 * 86400000).toISOString();

      const [post] = await sql`
        INSERT INTO "Post" ("id", "content", "authorId", "imageUrl", "forumId", "universityId", "audience", "expiresAt", "isForumPost")
        VALUES (gen_random_uuid(), ${caption || `Sent a ${attachment.type} from Telegram`}, ${linked.id}, ${attachment.url}, ${forum.id}, ${linked.universityId}, 'UNIVERSITY', ${expiresAt}, true)
        RETURNING id
      `;

      await ctx.reply(
        `✅ **Published!** 🚀\n🔗 [View](${BASE_URL}/forum/post/${post.id})`,
        { parse_mode: "Markdown" }
      );
    } catch (e: any) {
      console.error("Media publish error:", e);
      await ctx.reply("⚠️ Error publishing media. Please try again.").catch(() => {});
    }
  });
}
