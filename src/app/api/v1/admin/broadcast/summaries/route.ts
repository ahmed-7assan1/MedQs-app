import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const teams = await prisma.medicalTeam.findMany({
      where: { 
        summaryFrequency: { not: "NONE" },
        telegramGroupId: { not: null }
      }
    });

    const results = [];

    for (const team of teams) {
      const days = team.summaryFrequency === "DAILY" ? 1 : team.summaryFrequency === "WEEKLY" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch all content created for this team's lectures in the period
      const lectures = await prisma.lecture.findMany({
        where: { 
          teamId: team.id,
          OR: [
            { videos: { some: { createdAt: { gte: startDate } } } },
            { files: { some: { createdAt: { gte: startDate } } } }
          ]
        },
        include: {
          subject: true,
          videos: { where: { createdAt: { gte: startDate } } },
          files: { where: { createdAt: { gte: startDate } } }
        }
      });

      if (lectures.length === 0) continue;

      // Group by Subject
      const subjectsMap: Record<string, any[]> = {};
      lectures.forEach(l => {
        if (!subjectsMap[l.subject.name]) subjectsMap[l.subject.name] = [];
        subjectsMap[l.subject.name].push(l);
      });

      // Build Message
      let msg = `📅 *${team.summaryFrequency} SUMMARY*\n🏛 *Team:* ${team.name}\n\n`;

      for (const [subjectName, subjectLectures] of Object.entries(subjectsMap)) {
        msg += `📚 *${subjectName.toUpperCase()}*\n`;
        for (const lec of subjectLectures) {
          msg += `  📖 *${lec.title}*\n`;
          
          if (lec.videos.length > 0) {
            msg += `    🎥 Videos:\n`;
            lec.videos.forEach((v: any) => {
              msg += `      • [${v.title}](https://medonex.com/v2/student/lectures/${lec.id})\n`;
            });
          }
          
          if (lec.files.length > 0) {
            msg += `    📄 Files:\n`;
            lec.files.forEach((f: any) => {
              msg += `      • [${f.name}](https://medonex.com/v2/student/lectures/${lec.id})\n`;
            });
          }
          msg += `\n`;
        }
        msg += `\n---\n`;
      }

      msg += `\n✨ Keep studying with *MedOneX*!`;

      // Send to Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: team.telegramGroupId,
          text: msg,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      await prisma.medicalTeam.update({
        where: { id: team.id },
        data: { lastSummaryAt: new Date() }
      });

      results.push({ team: team.name, status: "sent" });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("[SUMMARY_ENGINE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
