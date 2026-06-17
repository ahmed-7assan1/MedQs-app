import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, BarChart3, ChevronRight, Eye, Plus, Settings2, Trophy, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Past Papers & Quizzes",
  description: "Access medical past papers, interactive MCQs, and practice quizzes. Prepare for exams with real exam questions and instant AI-powered feedback.",
};

export default async function PastPapersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const papers = await prisma.pastPaper.findMany({
    where: {
      ...(user?.semesterId ? { semesterId: user.semesterId } : {}),
      // @ts-ignore
      ...(!isAdmin ? { isPrivate: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { name: true } },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { score: "desc" },
        take: 3,
        select: { id: true, score: true, createdAt: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  const totalAttempts = papers.reduce((s: number, p: any) => s + p._count.attempts, 0);
  const completedPapers = papers.filter((p: any) => p.attempts.length > 0).length;
  const avgScore = papers.length
    ? Math.round(
      papers
        .filter((p: any) => p.attempts[0])
        .reduce((s: number, p: any) => s + (p.attempts[0]?.score ?? 0), 0) /
      Math.max(papers.filter((p: any) => p.attempts[0]).length, 1)
    )
    : 0;

  return (
    <StudentPageShell maxWidthClass="max-w-4xl" noTopPaddingMobile>

      {/* ── Admin Create button (mobile only) ── */}
      {isAdmin && (
        <div className="md:hidden mb-4 flex justify-end">
          <Link
            href="/admin/quiz-creator"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
            title="Create Quiz"
          >
            <Plus className="h-4 w-4 text-white" />
          </Link>
        </div>
      )}

      {/* ── HEADER (desktop only) ── */}
      <div className="hidden md:block mb-6 sm:mb-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500">Assessments</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Quizzes &amp; Past Papers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {papers.length} quiz{papers.length !== 1 ? "zes" : ""} available for your semester
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/quiz-creator"
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_6px_18px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Quiz</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── STATS ROW — compact on mobile like Img 2 ── */}
      {papers.length > 0 && (
        <div className="mb-6 sm:mb-8 mt-12 sm:mt-0 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Quizzes", value: papers.length, icon: FileText, color: "#1A6BCC", bg: "rgba(26,107,204,.08)", border: "rgba(26,107,204,.25)" },
            { label: "Completed", value: completedPapers, icon: Trophy, color: "#059669", bg: "rgba(5,150,105,.08)", border: "rgba(5,150,105,.25)" },
            { label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", icon: TrendingUp, color: "#8b5cf6", bg: "rgba(139,92,246,.08)", border: "rgba(139,92,246,.25)" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label}
              className="mobile-card p-3 sm:p-4 relative overflow-hidden rounded-2xl border"
              style={{ borderColor: border, borderLeft: `3px solid ${color}`, background: `linear-gradient(135deg, ${bg} 0%, transparent 70%)` }}>
              <div className="flex flex-col items-start sm:flex-row sm:items-start sm:justify-between gap-1">
                <div className="text-left">
                  <p className="whitespace-nowrap text-[10px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/40" style={{ transform: 'scale(0.7)', transformOrigin: 'left center' }}>{label}</p>
                  <p className="font-display text-3xl sm:text-2xl font-extrabold tabular-nums text-foreground dark:text-white lg:text-3xl">{value}</p>
                </div>
                <div className="hidden sm:flex rounded-xl p-2" style={{ background: bg }}>
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAPERS LIST ── */}
      {papers.length === 0 ? (
        <div className="mobile-card flex flex-col items-center py-16 sm:py-20 text-center">
          <div className="mb-4 rounded-2xl bg-blue-500/10 p-5">
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
          <p className="font-bold text-foreground dark:text-white">No quizzes yet</p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-white/40">Check back soon — your admin will publish quizzes here.</p>
          {isAdmin && (
            <Link href="/admin/quiz-creator"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Create First Quiz
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper: any) => {
            const bestAttempt = paper.attempts[0];
            const bestScore = bestAttempt?.score;
            const done = paper.attempts.length > 0;
            const scoreColor = bestScore !== undefined
              ? bestScore >= 70 ? "#059669" : bestScore >= 50 ? "#d97706" : "#dc2626"
              : "#1A6BCC";
            const scoreBg = bestScore !== undefined
              ? bestScore >= 70 ? "rgba(5,150,105,.08)" : bestScore >= 50 ? "rgba(217,119,6,.08)" : "rgba(220,38,38,.08)"
              : "rgba(26,107,204,.08)";

            return (
              <div key={paper.id}
                className="mobile-card overflow-hidden rounded-2xl border border-border/50 dark:border-white/[0.06] bg-card dark:bg-white/[0.03] shadow-sm transition-shadow hover:shadow-md"
                style={{ borderLeft: `3px solid ${done ? scoreColor : "#1A6BCC"}` }}>

                {/* Status dot + title row */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-4 pb-2 sm:pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: done ? scoreColor : "#1A6BCC" }} />
                    <h3 className="text-sm sm:text-base font-bold text-foreground dark:text-white truncate">{paper.title}</h3>
                  </div>
                  <Link href={`/quiz/${paper.id}`}
                    className="flex-none text-center rounded-lg sm:rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all active:scale-[0.97] shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${done ? scoreColor : "#1A6BCC"}, ${done ? scoreColor + "dd" : "#4f46e5"})` }}>
                    {bestAttempt ? "Retry" : "Start"}
                  </Link>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 px-4 sm:px-5 pb-2">
                  <span className="rounded-full bg-muted/50 dark:bg-white/[0.04] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground dark:text-white/50 truncate">{paper.module.name}</span>
                  {paper.timeLimitMin && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground dark:text-white/40 shrink-0">
                      <Clock className="h-2.5 w-2.5" /> {paper.timeLimitMin}m
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground dark:text-white/40 shrink-0">
                    <BarChart3 className="h-2.5 w-2.5" /> {paper._count.attempts}
                  </span>
                  {paper.isInteractive && (
                    <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[8px] font-bold text-violet-400">AI</span>
                  )}
                </div>

                {/* Score bar if attempted */}
                {bestScore !== undefined && (
                  <div className="flex items-center gap-2 px-4 sm:px-5 pb-2">
                    <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-muted/50 dark:bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${bestScore}%`, background: scoreColor }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: scoreColor }}>Best: {bestScore}%</span>
                  </div>
                )}

                {/* Full-width CTA on mobile + admin manage */}
                <div className="flex items-center justify-between px-4 sm:px-5 pb-4 sm:pb-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <Link href={`/admin/quiz-creator?paperId=${paper.id}`}
                        className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-border/50 dark:border-white/[0.04] bg-muted/30 dark:bg-white/[0.02] text-muted-foreground dark:text-white/40 transition-colors hover:bg-muted/60 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white"
                        title="Manage quiz">
                        <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Link>
                    )}
                    {/* Previous attempts — 1 on mobile */}
                    {paper.attempts.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground/70 dark:text-white/30">Prev:</span>
                        {paper.attempts.slice(0, 3).map((attempt: any) => (
                          <Link key={attempt.id} href={`/quiz/attempt/${attempt.id}`}
                            className="flex items-center gap-1 rounded-md border border-border/50 dark:border-white/[0.03] bg-muted/30 dark:bg-white/[0.02] px-1.5 py-0.5 text-[10px] transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.05]">
                            <span className="font-bold" style={{ color: attempt.score >= 70 ? "#059669" : attempt.score >= 50 ? "#d97706" : "#dc2626" }}>
                              {attempt.score}%
                            </span>
                            <span className="text-muted-foreground/70 dark:text-white/30">{new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                          </Link>
                        ))}
                        {paper._count.attempts > 3 && (
                          <span className="text-[10px] text-muted-foreground/70 dark:text-white/30">+{paper._count.attempts - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous attempts on mobile — inline chips */}
                {paper.attempts.length > 0 && (
                  <div className="flex sm:hidden items-center gap-1.5 px-4 pb-4 pt-0 border-t border-border/50 dark:border-white/[0.03]">
                    <span className="text-[9px] text-muted-foreground/70 dark:text-white/30">Previous:</span>
                    {paper.attempts.slice(0, 2).map((attempt: any) => (
                      <Link key={attempt.id} href={`/quiz/attempt/${attempt.id}`}
                        className="flex items-center gap-1 rounded-md border border-border/50 dark:border-white/[0.03] bg-muted/30 dark:bg-white/[0.02] px-1.5 py-0.5 text-[9px]">
                        <span className="font-bold" style={{ color: attempt.score >= 70 ? "#059669" : attempt.score >= 50 ? "#d97706" : "#dc2626" }}>
                          {attempt.score}%
                        </span>
                      </Link>
                    ))}
                    {paper._count.attempts > 2 && (
                      <Link href={`/quiz/${paper.id}`} className="text-[9px] text-muted-foreground/70 dark:text-white/30">+{paper._count.attempts - 2}</Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StudentPageShell>
  );
}


