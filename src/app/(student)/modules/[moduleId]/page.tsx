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
    <div className="min-h-screen bg-[#07080f] pb-32 pt-0">
      {/* ── Immersive Hero Section ── */}
      <div className="relative h-[400px] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-[#07080f] z-10" />
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
        
        <div className="container mx-auto px-6 relative z-20 pt-20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
             {/* Large Module Icon */}
             <div className="h-24 w-24 md:h-32 md:w-32 rounded-[32px] bg-gradient-to-br from-primary to-primary/40 p-[2px] shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-full w-full rounded-[30px] bg-[#131220] flex items-center justify-center">
                   <Brain className="h-10 w-10 md:h-14 md:w-14 text-primary" />
                </div>
             </div>

             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Academic Module
                  </span>
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {mod.subjects.length} Disciplines
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                  {mod.name}.
                </h1>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                   <div className="space-y-1">
                      <p className="text-xl font-black text-white">{totalLectures}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total Lectures</p>
                   </div>
                   <div className="h-8 w-px bg-white/5" />
                   <div className="space-y-1">
                      <p className="text-xl font-black text-white">{totalQ}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Practice Items</p>
                   </div>
                   <div className="h-8 w-px bg-white/5" />
                   <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className={cn(
                          "text-xl font-black",
                          modPct >= 70 ? "text-emerald-500" : modPct > 0 ? "text-amber-500" : "text-white/40"
                        )}>
                          {modPct}%
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Completion</p>
                      </div>
                      <div className="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
                          style={{ width: `${modPct}%` }}
                        />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {isAdmin && (
          <div className="mb-12">
            <SubjectInlineManager
              moduleId={mod.id}
              initialSubjects={mod.subjects.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        )}

        {/* ── Subjects Grid ── */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Curriculum</h2>
                <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Available Disciplines</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
               <Activity className="h-4 w-4 text-primary" /> Tracking Progress
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group relative flex flex-col bg-[#131220] border border-white/5 rounded-[32px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 overflow-hidden"
                >
                  {/* Subject Glow */}
                  <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", accent.bgColor)} />

                  <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg",
                      accent.bgColor
                    )}>
                      <IconComp className={cn("h-7 w-7", accent.iconColor)} />
                    </div>
                    {subjQ > 0 && (
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                        subjPct >= 70 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : subjPct > 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-white/5 text-white/20 border-white/5"
                      )}>
                        {subjPct}% Done
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{subject.name}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-white/30 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5">
                         <Layers className="h-3.5 w-3.5" />
                         {subject.lectures.length}
                       </span>
                       <div className="h-1 w-1 rounded-full bg-white/10" />
                       <span className="flex items-center gap-1.5">
                         <HelpCircle className="h-3.5 w-3.5" />
                         {subjQ}
                       </span>
                    </div>
                  </div>

                  {/* Bottom Progress Bar */}
                  {subjQ > 0 && (
                    <div className="mt-8 space-y-2">
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full transition-all duration-1000", accent.progressColor)}
                           style={{ width: `${subjPct}%` }}
                         />
                       </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    Enter Subject <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Immersive Past Papers Section ── */}
        {mod.pastPapers.length > 0 && (
          <div className="mt-24 space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-violet-500" />
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Assessments</h2>
                <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Previous Years & Mock Exams</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mod.pastPapers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/quiz/${paper.id}`}
                  className="group relative bg-[#131220] border border-white/5 rounded-3xl p-5 transition-all hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1"
                >
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      {paper.isInteractive && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-[8px] font-black uppercase text-violet-400 border border-violet-500/20">
                          Interactive
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors">
                      {paper.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center gap-4 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                         <Clock className="h-3 w-3" />
                         {paper.timeLimitMin || 0}m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
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
      </div>
    </div>
  );
}
