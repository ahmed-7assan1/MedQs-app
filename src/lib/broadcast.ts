import { prisma } from "./prisma";

export async function broadcastToTeamTelegram(item: { 
  type: 'file' | 'video' | 'record', 
  id: string,
  title: string,
  lectureId: string 
}) {
  try {
    // 1. Get Lecture and its Team
    const lecture = await prisma.lecture.findUnique({
      where: { id: item.lectureId },
      include: { 
        subject: true,
        team: true 
      }
    });

    if (!lecture) return;

    const team = lecture.team as any;
    if (!team?.telegramGroupId) return;

    const subject = lecture.subject;
    const template = team.telegramTemplate || "🎓 *New Material Added*\n\n📚 *Subject:* {{subject}}\n📖 *Lecture:* {{lecture}}\n📝 *Title:* {{title}}\n\n🔗 [Access on Site]({{link}})";

    // 2. Build placeholders
    const placeholders: Record<string, string> = {
      subject: subject.name,
      lecture: lecture.title,
      title: item.title,
      subject_tag: subject.name.replace(/\s+/g, '_'),
      link: `https://medonex.com/v2/student/lectures/${lecture.id}`
    };

    // 3. Formulate Message
    let message = template;
    for (const [key, value] of Object.entries(placeholders)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // 4. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: team.telegramGroupId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    if (res.ok) {
      // Mark as broadcasted
      const table = item.type === 'file' ? 'lectureFile' : item.type === 'video' ? 'lectureVideo' : 'lectureRecord';
      await (prisma as any)[table].update({
        where: { id: item.id },
        data: { isBroadcasted: true }
      });
    }

  } catch (error) {
    console.error("[BROADCAST] Error:", error);
  }
}
