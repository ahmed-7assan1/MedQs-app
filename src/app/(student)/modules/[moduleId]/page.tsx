import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight, Layers, FileText, Clock, BarChart3,
  Brain, Bone, Microscope, Shield, Pill, Activity,
  HelpCircle, FlaskConical, Dna, Atom,
  Stethoscope, HeartPulse, Syringe, CheckCircle2, Tablets, 
  ClipboardList, Thermometer, Eye, Ear, Hand, Biohazard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectInlineManager } from "@/components/admin-inline/SubjectInlineManager";
import TopBar from "@/components/modules/TopBar";
import PageContainer from "@/components/modules/PageContainer";

export const revalidate = 60;

// Map subject names to discipline icons + colors
const ICON_MAP: Record<string, any> = {
  Brain, Bone, HeartPulse, Activity, Microscope, Pill, FlaskConical, 
  Dna, Atom, Stethoscope, Syringe, CheckCircle2, Tablets, 
  ClipboardList, Thermometer, Eye, Ear, Hand, Biohazard, Layers
};

function getSubjectAccent(name: string, customIcon?: string | null): {
  icon: any; iconColor: string; bgColor: string; borderColor: string; progressColor: string;
} {
  const n = name.toUpperCase();
  let iconObj: any = customIcon && ICON_MAP[customIcon] ? ICON_MAP[customIcon] : null;

  const getReturn = (icon: any, iconColor: string, bgColor: string, borderColor: string, progressColor: string) => ({
    icon: iconObj || icon, iconColor, bgColor, borderColor, progressColor
  });

  if (n.includes("ANATOMY") || n.includes("ANAT"))
    return getReturn(Bone, "text-red-500", "bg-red-500/10", "border-l-red-500", "bg-gradient-to-r from-red-500 to-rose-400");
  if (n.includes("HISTO") || n.includes("HISTOLOGY"))
    return getReturn(Microscope, "text-pink-500", "bg-pink-500/10", "border-l-pink-500", "bg-gradient-to-r from-pink-500 to-fuchsia-400");
  if (n.includes("MICRO") || n.includes("MICROBIO"))
    return getReturn(Atom, "text-teal-500", "bg-teal-500/10", "border-l-teal-500", "bg-gradient-to-r from-teal-500 to-cyan-400");
  if (n.includes("PARA") || n.includes("PARASITO"))
    return getReturn(Shield, "text-amber-500", "bg-amber-500/10", "border-l-amber-500", "bg-gradient-to-r from-amber-500 to-orange-400");
  if (n.includes("PATHO") || n.includes("PATHOLOGY"))
    return getReturn(FlaskConical, "text-orange-500", "bg-orange-500/10", "border-l-orange-500", "bg-gradient-to-r from-orange-500 to-red-400");
  if (n.includes("PHARMA") || n.includes("PHARMACOLOGY"))
    return getReturn(Pill, "text-emerald-500", "bg-emerald-500/10", "border-l-emerald-500", "bg-gradient-to-r from-emerald-500 to-green-400");
  if (n.includes("PHYSIO") || n.includes("PHYSIOLOGY"))
    return getReturn(Activity, "text-blue-500", "bg-blue-500/10", "border-l-blue-500", "bg-gradient-to-r from-blue-500 to-sky-400");
  if (n.includes("QUIZ") || n.includes("QUESTION") || n.includes("BANK"))
    return getReturn(HelpCircle, "text-violet-500", "bg-violet-500/10", "border-l-violet-500", "bg-gradient-to-r from-violet-500 to-purple-400");
  if (n.includes("NEURO") || n.includes("CNS"))
    return getReturn(Brain, "text-purple-500", "bg-purple-500/10", "border-l-purple-500", "bg-gradient-to-r from-purple-500 to-violet-400");
  if (n.includes("BIOCHEM") || n.includes("GENETICS") || n.includes("DNA"))
    return getReturn(Dna, "text-sky-500", "bg-sky-500/10", "border-l-sky-500", "bg-gradient-to-r from-sky-500 to-blue-400");

  return getReturn(Layers, "text-primary", "bg-primary/10", "border-l-primary", "bg-gradient-to-r from-primary to-blue-400");
}

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true, role: true },
  });

  const resolvedRole = user?.role || role;
  const isAdmin = resolvedRole === "ADMIN" || resolvedRole === "SUPER_ADMIN";

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

  const subjectIds = mod.subjects.map(s => s.id);
  const correctBySubject: Record<string, Set<string>> = {};
  
  // Only fetch correct items for the subjects in this module to reduce DB load
  const items = await prisma.quizAttemptItem.findMany({
    where: { 
      attempt: { userId: session.user.id }, 
      isCorrect: true,
      question: { lecture: { subjectId: { in: subjectIds } } }
    },
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
    <div className="min-h-screen bg-background">
      <TopBar userName={session?.user?.name} userImage={session?.user?.image} />
      <PageContainer>
        {/* ── Compact Module Header ── */}
        <div className="relative overflow-hidden rounded-3xl p-6 mt-6 bg-gradient-to-br from-background via-card/50 to-background shadow-[var(--shadow-card)] ring-1 ring-border/60">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/40 p-[2px] shrink-0">
              <div className="h-full w-full rounded-[13px] bg-background flex items-center justify-center">
                <Brain className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Academic Module</span>
              <h1 className="text-2xl font-black text-foreground tracking-tight truncate">{mod.name}.</h1>
              <div className="sm:hidden flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{totalLectures} Lectures</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{totalQ} Qs</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", modPct >= 70 ? "text-emerald-500" : modPct > 0 ? "text-amber-500" : "text-muted-foreground")}>{modPct}%</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-5">
              <div className="text-right">
                <p className="text-lg font-black text-foreground">{totalLectures}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lectures</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-right">
                <p className="text-lg font-black text-foreground">{totalQ}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Questions</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-right">
                <p className={cn("text-lg font-black", modPct >= 70 ? "text-emerald-500" : modPct > 0 ? "text-amber-500" : "text-muted-foreground")}>{modPct}%</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mastery</p>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8">
            <SubjectInlineManager
              moduleId={mod.id}
              initialSubjects={mod.subjects.map((s) => ({ id: s.id, name: s.name, icon: s.icon }))}
            />
          </div>
        )}

        {/* ── Subjects Grid ── */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Curriculum</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available Disciplines</p>
              </div>
            </div>
            {mod.subjects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                No subjects available for this module.
              </p>
            )}
            
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-xl border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               <Activity className="h-4 w-4 text-primary" /> Tracking Progress
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mod.subjects.map((subject, i) => {
              const subjQ = subject.lectures.reduce((a, l) => a + l._count.questions, 0);
              const subjCorr = correctBySubject[subject.id]?.size ?? 0;
              const subjPct = subjQ > 0 ? Math.round((subjCorr / subjQ) * 100) : 0;
              const accent = getSubjectAccent(subject.name, subject.icon);
              const IconComp = accent.icon;

              return (
                <Link
                  key={subject.id}
                  href={`/modules/${mod.id}/subjects/${subject.id}`}
                  className="group relative flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 bg-card border border-border/60 hover:border-primary/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 transition-all active:scale-[0.98] shadow-sm sm:shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between sm:mb-6 shrink-0 sm:shrink-1">
                    <div className={cn(
                      "h-11 w-11 sm:h-12 md:h-14 sm:w-12 md:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md",
                      accent.bgColor
                    )}>
                      <IconComp className={cn("h-5.5 w-5.5 sm:h-6 md:h-7 sm:w-6 md:w-7", accent.iconColor)} />
                    </div>
                    {subjQ > 0 && (
                      <div className={cn(
                        "hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border",
                        subjPct >= 70 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : subjPct > 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border"
                      )}>
                        {subjPct}% Done
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 sm:space-y-1">
                    <h3 className="text-[15px] sm:text-lg md:text-xl font-black text-card-foreground truncate">{subject.name}</h3>
                    <div className="flex items-center gap-2.5 sm:gap-3 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 sm:mt-0">
                       <span className="flex items-center gap-1">
                         <Layers className="h-3 w-3" /> {subject.lectures.length} <span className="hidden sm:inline">Lectures</span>
                       </span>
                       <div className="h-1 w-1 rounded-full bg-border" />
                       <span className="flex items-center gap-1">
                         <HelpCircle className="h-3 w-3" /> {subjQ} <span className="hidden sm:inline">Questions</span>
                       </span>
                    </div>
                  </div>

                  {subjQ > 0 ? (
                    <div className="flex sm:w-full flex-col sm:mt-6 md:mt-8 items-end sm:items-stretch gap-1 shrink-0">
                      {/* Mobile Progress Info */}
                      <div className="text-right sm:hidden">
                        <span className={cn(
                          "text-xs font-black",
                          subjPct >= 70 ? "text-emerald-400" : subjPct > 0 ? "text-amber-400" : "text-muted-foreground"
                        )}>
                          {subjPct}%
                        </span>
                        <div className="h-1 w-12 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className={cn("h-full transition-all duration-1000", accent.progressColor)} style={{ width: `${subjPct}%` }} />
                        </div>
                      </div>
                      
                      {/* Desktop Progress Bar */}
                      <div className="hidden sm:block h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", accent.progressColor)}
                          style={{ width: `${subjPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="sm:hidden shrink-0 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Past Papers Section ── */}
        {mod.pastPapers.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-violet-500" />
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Assessments</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Previous Years & Mock Exams</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mod.pastPapers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/quiz/${paper.id}`}
                  className="group relative bg-card border border-border rounded-3xl p-5 transition-all hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1"
                >
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      {paper.isInteractive && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-[10px] font-black uppercase text-violet-400 border border-violet-500/20">
                          Interactive
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-bold text-card-foreground line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors">
                      {paper.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center gap-4 border-t border-border">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                         <Clock className="h-3 w-3" />
                         {paper.timeLimitMin || 0}m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                         <BarChart3 className="h-3 w-3" />
                         {paper._count.attempts}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
