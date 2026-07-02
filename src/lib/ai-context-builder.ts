import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ContextTier = "syllabus" | "quiz" | "leaderboard";

const SYLLABUS_KEYWORDS = [
  "module", "lecture", "syllabus", "curriculum", "subject", "topic", "study",
    "منهج", "محاضرة", "مادة", "درس", "مقرر", "موديول", "شرح", "افهم", "فهم",
    "شرحلي", "عاوز", "عايز", "ملخص", "لخص",
];

const QUIZ_KEYWORDS = [
  "quiz", "exam", "score", "grade", "question", "mcq",
    "اختبار", "امتحان", "كويز", "درجة", "درجات", "اسئله", "أسئلة",
];

const LEADERBOARD_KEYWORDS = [
  "leaderboard", "rank", "top", "ترتيب", "ليدر", "توب", "اول",
];

export function detectTiers(message: string): ContextTier[] {
  const lower = message.toLowerCase();
  const tiers: ContextTier[] = [];
  if (SYLLABUS_KEYWORDS.some((k) => lower.includes(k))) tiers.push("syllabus");
  if (QUIZ_KEYWORDS.some((k) => lower.includes(k))) tiers.push("quiz");
  if (LEADERBOARD_KEYWORDS.some((k) => lower.includes(k))) tiers.push("leaderboard");
  return tiers;
}

export async function buildStudentContext(
  userId: string,
  message?: string,
  existingUser?: {
    name: string | null;
    semesterId: string | null;
    points: number;
    semester: { name: string; id: string } | null;
    university: { name: string } | null;
    rank: { label: string } | null;
  },
): Promise<string> {
  const tiers = message ? detectTiers(message) : ["syllabus", "quiz"];
  const parts: string[] = [];

  const user = existingUser ?? await prisma.user.findUnique({
    where: { id: userId },
    include: {
      university: { select: { name: true } },
      semester: { select: { name: true, id: true } },
      rank: { select: { label: true } },
    },
  });

  if (!user) return "";

  const profileParts: string[] = [];
  if (user.name) profileParts.push(user.name);
  if (user.semester) profileParts.push(user.semester.name);
  if (user.university)
    profileParts.push(
      user.university.name.replace(
        /^(Faculty|College|University|كلية|جامعة)\s+/i,
        "",
      ),
    );
  if (user.rank) profileParts.push(`Rank:${user.rank.label}`);

  if (profileParts.length > 0) {
    parts.push(`##Student: ${profileParts.join(" · ")}`);
  }

  if (tiers.includes("syllabus")) {
    const lastActivity = await prisma.$queryRaw<
      Array<{
        lectureTitle: string;
        subjectName: string;
        moduleName: string;
        lastViewedAt: Date;
      }>
    >(
      Prisma.sql`
        SELECT
          l."title" as "lectureTitle",
          s."name" as "subjectName",
          m."name" as "moduleName",
          a."lastViewedAt"
        FROM "UserLectureActivity" a
        JOIN "Lecture" l ON l."id" = a."lectureId"
        JOIN "Subject" s ON s."id" = l."subjectId"
        JOIN "Module" m ON m."id" = s."moduleId"
        WHERE a."userId" = ${userId}
        ORDER BY a."lastViewedAt" DESC
        LIMIT 1
      `,
    );

    if (lastActivity.length > 0) {
      const latest = lastActivity[0];
      const daysAgo = Math.floor(
        (Date.now() - new Date(latest.lastViewedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      parts.push(
        `##LastLecture: ${latest.lectureTitle} (${latest.moduleName}/${latest.subjectName}) ${daysAgo > 0 ? `${daysAgo}d ago` : "today"}`,
      );
    }

    if (user.semester?.id) {
      const modules = await prisma.module.findMany({
        where: { semesterId: user.semester.id },
        include: {
          subjects: {
            select: {
              name: true,
              lectures: {
                select: { title: true },
                orderBy: { order: "asc" },
                take: 3,
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      if (modules.length > 0) {
        const syllabusLines = modules.map((m) => {
          const subs = m.subjects
            .map((s) => {
              const lecs = s.lectures.map((l) => l.title).join(", ");
              return lecs ? `${s.name}[${lecs}]` : s.name;
            })
            .join(" ");
          return `${m.name}{${subs}}`;
        });
        parts.push(
          `##Curriculum: ${syllabusLines.join(" | ")}`,
        );
      }
    }
  }

  if (tiers.includes("quiz")) {
    const [completedQuizzes, wrongItems, pendingQuizzes] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) } },
        include: {
          items: { select: { isCorrect: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.quizAttemptItem.findMany({
        where: {
          attempt: { userId },
          isCorrect: false,
        },
        take: 30,
        orderBy: { attempt: { createdAt: "desc" } },
        select: {
          question: {
            select: {
              body: true,
              lecture: {
                select: {
                  title: true,
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.v2Quiz.findMany({
        where: {
          publishedAt: { not: null },
          module: {
            term: {
              enrollments: { some: { studentUserId: userId } },
            },
          },
        },
        select: { title: true, module: { select: { name: true } } },
        take: 5,
      }),
    ]);

    if (completedQuizzes.length > 0) {
      const totalCorrect = completedQuizzes.reduce(
        (s, a) => s + a.score,
        0,
      );
      const totalPossible = completedQuizzes.reduce(
        (s, a) => s + (a.items?.length ?? 0),
        0,
      );
      const avgPct =
        totalPossible > 0
          ? Math.round((totalCorrect / totalPossible) * 100)
          : 0;
      parts.push(
        `##Quiz: ${completedQuizzes.length} taken, avg ${avgPct}%`,
      );
    }

    if (wrongItems.length > 0) {
      const weakMap = new Map<string, number>();
      for (const item of wrongItems) {
        const lec = item.question.lecture;
        const key = `${lec.subject.name}/${lec.title}`;
        weakMap.set(key, (weakMap.get(key) || 0) + 1);
      }
      const weakAreas = [...weakMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      parts.push(
        `##Weak: ${weakAreas.map(([area, count]) => `${area}(${count}x)`).join(", ")}`,
      );
    }

    if (pendingQuizzes.length > 0) {
      parts.push(
        `##Pending: ${pendingQuizzes.map((q) => q.title).join(", ")}`,
      );
    }
  }

  if (tiers.includes("leaderboard")) {
    const [topUsers, userRank, totalStudents] = await Promise.all([
      prisma.user.findMany({
        where: {
          points: { gt: 0 },
          hideRank: false,
          semesterId: user.semesterId!,
        },
        orderBy: { points: "desc" },
        take: 3,
        select: { name: true, points: true },
      }),
      prisma.user.count({
        where: {
          points: { gt: user.points },
          semesterId: user.semesterId!,
          hideRank: false,
        },
      }),
      prisma.user.count({
        where: {
          semesterId: user.semesterId!,
          hideRank: false,
        },
      }),
    ]);

    if (topUsers.length > 0) {
      const topStr = topUsers
        .map((u, i) => `${i + 1}.${u.name}(${u.points})`)
        .join(", ");
      parts.push(
        `##Leaderboard: #${userRank + 1}/${totalStudents} | Top: ${topStr}`,
      );
    }
  }

  return parts.join("\n");
}
