import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, BarChart3, ChevronRight, Eye, Plus, Settings2, Trophy, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const totalAttempts = papers.reduce((s, p) => s + p._count.attempts, 0);
  const completedPapers = papers.filter(p => p.attempts.length > 0).length;
  const avgScore = papers.length
    ? Math.round(
        papers
          .filter(p => p.attempts[0])
          .reduce((s, p) => s + (p.attempts[0]?.score ?? 0), 0) /
          Math.max(papers.filter(p => p.attempts[0]).length, 1)
      )
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">

      {/* ── HEADER ── */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500">Assessments</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Quizzes & Past Papers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {papers.length} quiz{papers.length !== 1 ? "zes" : ""} available for your semester
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/quiz-creator"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_6px_18px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Create Quiz
            </Link>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      {papers.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: "Total Quizzes", value: papers.length, icon: FileText, color: "#1A6BCC", bg: "rgba(26,107,204,.08)", border: "rgba(26,107,204,.25)" },
            { label: "Completed", value: completedPapers, icon: Trophy, color: "#059669", bg: "rgba(5,150,105,.08)", border: "rgba(5,150,105,.25)" },
            { label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", icon: TrendingUp, color: "#8b5cf6", bg: "rgba(139,92,246,.08)", border: "rgba(139,92,246,.25)" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border p-4"
              style={{ borderColor: border, borderLeft: `3px solid ${color}`, background: `linear-gradient(135deg, ${bg} 0%, transparent 70%)` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground lg:text-3xl">{value}</p>
                </div>
                <div className="rounded-xl p-2" style={{ background: bg }}>
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAPERS LIST ── */}
      {papers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 rounded-2xl bg-blue-500/10 p-5">
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
          <p className="font-semibold text-foreground">No quizzes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon — your admin will publish quizzes here.</p>
          {isAdmin && (
            <Link href="/admin/quiz-creator"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Create First Quiz
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => {
            const bestAttempt = paper.attempts[0];
            const bestScore   = bestAttempt?.score;
            const done        = paper.attempts.length > 0;
            const scoreColor  = bestScore !== undefined
              ? bestScore >= 70 ? "#059669" : bestScore >= 50 ? "#d97706" : "#dc2626"
              : "#1A6BCC";
            const scoreBg     = bestScore !== undefined
              ? bestScore >= 70 ? "rgba(5,150,105,.08)" : bestScore >= 50 ? "rgba(217,119,6,.08)" : "rgba(220,38,38,.08)"
              : "rgba(26,107,204,.08)";

            return (
              <div key={paper.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-blue-500/30 hover:shadow-lg dark:bg-slate-900/50"
                style={{ borderLeft: `3px solid ${done ? scoreColor : "#1A6BCC"}` }}>

                {/* Main row */}
                <div className="flex items-center justify-between gap-4 px-5 py-4.5">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Icon */}
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: done ? scoreBg : "rgba(26,107,204,.08)" }}>
                      {done
                        ? <Trophy className="h-5 w-5" style={{ color: scoreColor }} />
                        : <FileText className="h-5 w-5 text-blue-500" />
                      }
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{paper.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted/60 px-2 py-0.5 font-medium">{paper.module.name}</span>
                        {paper.timeLimitMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {paper.timeLimitMin} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" /> {paper._count.attempts} attempts
                        </span>
                        {paper.isInteractive && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-500">
                            Interactive
                          </span>
                        )}
                      </div>

                      {/* Score bar if attempted */}
                      {bestScore !== undefined && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${bestScore}%`, background: scoreColor }} />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: scoreColor }}>
                            Best: {bestScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {isAdmin && (
                      <Link href={`/admin/quiz-creator?paperId=${paper.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Manage quiz">
                        <Settings2 className="h-4 w-4" />
                      </Link>
                    )}
                    <Link href={`/quiz/${paper.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{ background: `linear-gradient(135deg, ${done ? scoreColor : "#1A6BCC"}, ${done ? scoreColor + "dd" : "#4f46e5"})` }}>
                      {bestAttempt ? "Retry" : "Start"}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Previous attempts */}
                {paper.attempts.length > 0 && (
                  <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Previous:</span>
                      {paper.attempts.map((attempt) => (
                        <Link key={attempt.id} href={`/quiz/attempt/${attempt.id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] transition-colors hover:border-primary/30 hover:bg-muted">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="font-bold" style={{
                            color: attempt.score >= 70 ? "#059669" : attempt.score >= 50 ? "#d97706" : "#dc2626"
                          }}>
                            {attempt.score}%
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                        </Link>
                      ))}
                      {paper._count.attempts > 3 && (
                        <span className="text-[11px] text-muted-foreground">+{paper._count.attempts - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
