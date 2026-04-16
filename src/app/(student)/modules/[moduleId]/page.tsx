import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight, Layers, FileText, Clock, BarChart3,
  Brain, Bone, Microscope, Shield, Pill, Activity,
  HelpCircle, FlaskConical, Dna, Atom
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectInlineManager } from "@/components/admin-inline/SubjectInlineManager";

// Map subject names to discipline icons + colors
function getSubjectAccent(name: string): {
  icon: any; iconColor: string; bgColor: string; borderColor: string; progressColor: string;
} {
  const n = name.toUpperCase();
  if (n.includes("ANATOMY") || n.includes("ANAT"))
    return { icon: Bone, iconColor: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-l-red-500", progressColor: "bg-gradient-to-r from-red-500 to-rose-400" };
  if (n.includes("HISTO") || n.includes("HISTOLOGY"))
    return { icon: Microscope, iconColor: "text-pink-500", bgColor: "bg-pink-500/10", borderColor: "border-l-pink-500", progressColor: "bg-gradient-to-r from-pink-500 to-fuchsia-400" };
  if (n.includes("MICRO") || n.includes("MICROBIO"))
    return { icon: Atom, iconColor: "text-teal-500", bgColor: "bg-teal-500/10", borderColor: "border-l-teal-500", progressColor: "bg-gradient-to-r from-teal-500 to-cyan-400" };
  if (n.includes("PARA") || n.includes("PARASITO"))
    return { icon: Shield, iconColor: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-l-amber-500", progressColor: "bg-gradient-to-r from-amber-500 to-orange-400" };
  if (n.includes("PATHO") || n.includes("PATHOLOGY"))
    return { icon: FlaskConical, iconColor: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-l-orange-500", progressColor: "bg-gradient-to-r from-orange-500 to-red-400" };
  if (n.includes("PHARMA") || n.includes("PHARMACOLOGY"))
    return { icon: Pill, iconColor: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-l-emerald-500", progressColor: "bg-gradient-to-r from-emerald-500 to-green-400" };
  if (n.includes("PHYSIO") || n.includes("PHYSIOLOGY"))
    return { icon: Activity, iconColor: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-l-blue-500", progressColor: "bg-gradient-to-r from-blue-500 to-sky-400" };
  if (n.includes("QUIZ") || n.includes("QUESTION") || n.includes("BANK"))
    return { icon: HelpCircle, iconColor: "text-violet-500", bgColor: "bg-violet-500/10", borderColor: "border-l-violet-500", progressColor: "bg-gradient-to-r from-violet-500 to-purple-400" };
  if (n.includes("NEURO") || n.includes("CNS"))
    return { icon: Brain, iconColor: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-l-purple-500", progressColor: "bg-gradient-to-r from-purple-500 to-violet-400" };
  if (n.includes("BIOCHEM") || n.includes("GENETICS") || n.includes("DNA"))
    return { icon: Dna, iconColor: "text-sky-500", bgColor: "bg-sky-500/10", borderColor: "border-l-sky-500", progressColor: "bg-gradient-to-r from-sky-500 to-blue-400" };
  // Default
  return { icon: Layers, iconColor: "text-primary", bgColor: "bg-primary/10", borderColor: "border-l-primary", progressColor: "bg-gradient-to-r from-primary to-blue-400" };
}

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const mod = await prisma.module.findFirst({
    where: { id: params.moduleId, semesterId: user?.semesterId ?? "__none__" },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: {
          lectures: {
            orderBy: { order: "asc" },
            include: {
              _count: { select: { questions: true, flashcards: true } },
              files: { select: { id: true } },
            },
          },
        },
      },
      pastPapers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          timeLimitMin: true,
          isInteractive: true,
          _count: { select: { attempts: true } },
        },
      },
    },
  });

  if (!mod) notFound();

  const correctBySubject: Record<string, Set<string>> = {};
  const items = await prisma.quizAttemptItem.findMany({
    where: { attempt: { userId: session.user.id }, isCorrect: true },
    select: {
      questionId: true,
      question: { select: { lecture: { select: { subjectId: true } } } },
    },
  });
  for (const item of items) {
    const sid = item.question.lecture.subjectId;
    if (!correctBySubject[sid]) correctBySubject[sid] = new Set();
    correctBySubject[sid].add(item.questionId);
  }

  // Module-level progress
  const totalQ = mod.subjects.flatMap(s => s.lectures).reduce((a, l) => a + l._count.questions, 0);
  const totalCorr = mod.subjects.reduce((a, s) => a + (correctBySubject[s.id]?.size ?? 0), 0);
  const modPct = totalQ > 0 ? Math.round((totalCorr / totalQ) * 100) : 0;
  const totalLectures = mod.subjects.flatMap(s => s.lectures).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/modules" className="transition-colors hover:text-foreground">Modules</Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="font-medium text-foreground">{mod.name}</span>
      </nav>

      {/* Module Hero Header */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold md:text-3xl">{mod.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick a subject to start studying.</p>

            {/* Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {mod.subjects.length} subjects
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {totalLectures} lectures
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                {totalQ} questions
              </span>
              <span className={cn(
                "font-semibold",
                modPct >= 70 ? "text-emerald-500" : modPct > 0 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {modPct}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Module progress bar */}
        {totalQ > 0 && (
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-700"
                style={{ width: `${Math.max(modPct, modPct > 0 ? 1 : 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isAdmin ? (
        <SubjectInlineManager
          moduleId={mod.id}
          initialSubjects={mod.subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      ) : null}

      {/* Subjects section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Subjects</span>
        </div>

        <div className="space-y-2">
          {mod.subjects.map((subject, i) => {
            const subjQ = subject.lectures.reduce((a, l) => a + l._count.questions, 0);
            const subjCorr = correctBySubject[subject.id]?.size ?? 0;
            const subjPct = subjQ > 0 ? Math.round((subjCorr / subjQ) * 100) : 0;
            const accent = getSubjectAccent(subject.name);
            const IconComp = accent.icon;
            const isStarted = subjCorr > 0;

            return (
              <Link
                key={subject.id}
                href={`/modules/${mod.id}/subjects/${subject.id}`}
                className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                style={{ borderLeft: "3px solid transparent", animationDelay: `${i * 50}ms` }}
              >
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors duration-150 group-hover:bg-muted/40",
                )}>
                  {/* Accent left border via absolute */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r", isStarted ? accent.progressColor : "bg-border")} />

                  {/* Icon circle */}
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                    accent.bgColor
                  )}>
                    <IconComp className={cn("h-5 w-5", accent.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight">{subject.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {subject.lectures.length} lecture{subject.lectures.length !== 1 ? "s" : ""}
                      {subjQ > 0 && ` · ${subjQ} questions`}
                    </p>
                  </div>

                  {/* Right: progress + arrow */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    {subjQ > 0 && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        subjPct === 0 ? "bg-muted text-muted-foreground"
                          : subjPct >= 70 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      )}>
                        {subjPct}%
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Thin progress bar at bottom of card */}
                {subjQ > 0 && (
                  <div className="h-[2px] w-full bg-muted">
                    <div
                      className={cn("h-full transition-all duration-700", accent.progressColor)}
                      style={{ width: `${subjPct}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Past Papers */}
      {mod.pastPapers.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-0.5 rounded-full bg-violet-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Past Papers</span>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none" style={{ scrollSnapType: "x mandatory" }}>
            {mod.pastPapers.map((paper) => (
              <Link
                key={paper.id}
                href={`/quiz/${paper.id}`}
                className="group flex-shrink-0 rounded-xl border border-border bg-card p-4 transition-all hover:border-violet-500/30 hover:shadow-md hover:-translate-y-px"
                style={{ width: "200px", scrollSnapAlign: "start", borderLeft: "3px solid #8b5cf6" }}
              >
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{paper.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {paper.isInteractive && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                      Interactive
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    <BarChart3 className="h-2.5 w-2.5" />
                    {paper._count.attempts}
                  </span>
                  {paper.timeLimitMin && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {paper.timeLimitMin}m
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-violet-500 opacity-0 transition-opacity group-hover:opacity-100">
                  Start <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
