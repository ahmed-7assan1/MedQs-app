import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToSheets } from "@/lib/sheets";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "quiz";

  try {
    if (type === "quiz") {
      const attempts = await prisma.quizAttempt.findMany({
        where: w.isSuper
          ? undefined
          : {
              pastPaper: {
                semester: { academicYear: { universityId: w.scope.universityId! } },
              },
            },
        orderBy: { createdAt: "desc" },
        take: 1000,
        include: {
          user: { select: { name: true, email: true } },
          pastPaper: { select: { title: true } },
        },
      });

      const rows = attempts.map((a) => ({
        Student:    a.user.name,
        Email:      a.user.email,
        Paper:      a.pastPaper.title,
        Score:      a.score,
        TimeTaken:  a.timeTaken,
        Date:       a.createdAt.toISOString().split("T")[0],
      }));

      const { spreadsheetUrl } = await exportToSheets("Quiz Results", rows);
      return NextResponse.json({ url: spreadsheetUrl, rows: rows.length });
    }

    if (type === "users") {
      const users = await prisma.user.findMany({
        where: w.isSuper ? undefined : { universityId: w.scope.universityId! },
        orderBy: { createdAt: "desc" },
        select: {
          name: true, email: true, points: true, role: true, createdAt: true,
          rank: { select: { label: true } },
          university: { select: { name: true } },
          semester: { select: { name: true } },
        },
      });

      const rows = users.map((u) => ({
        Name:        u.name,
        Email:       u.email,
        University:  u.university?.name ?? "",
        Semester:    u.semester?.name ?? "",
        Rank:        u.rank?.label ?? "Newbie",
        Points:      u.points,
        Role:        u.role,
        Joined:      u.createdAt.toISOString().split("T")[0],
      }));

      const { spreadsheetUrl } = await exportToSheets("Users", rows);
      return NextResponse.json({ url: spreadsheetUrl, rows: rows.length });
    }

    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
