import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { LectureInlineManager } from "@/components/admin-inline/LectureInlineManager";
import { 
  Video, FileQuestion, Layers, FileText, ChevronRight, 
  ArrowLeft, Clock, PlayCircle, BookOpen, GraduationCap,
  Microscope, Brain, Bone, Shield, Pill, Activity, HelpCircle,
  FlaskConical, Dna, Atom
} from "lucide-react";

export const revalidate = 60;

// Map subject names to discipline icons + colors (Synchronized with Module page)
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

export default async function SubjectLecturesPage({
  params,
  searchParams,
}: {
  params: { moduleId: string; subjectId: string };
  searchParams: { tab?: string };
}) {
  const activeTab = searchParams.tab || "lectures";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const subject = await prisma.subject.findFirst({
    where: {
      id: params.subjectId,
      moduleId: params.moduleId,
      module: { semesterId: user?.semesterId ?? "__none__" },
    },
    include: {
      module: { select: { name: true, id: true } },
      lectures: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { questions: true, flashcards: true } },
          files: { select: { id: true } },
          checklist: { include: { items: true } },
        },
      },
    },
  });

  if (!subject) notFound();
  
  const theoreticalLectures = subject.lectures.filter(l => l.type === "LECTURE");
  const practicalLectures = subject.lectures.filter(l => l.type === "PRACTICAL");
  const currentLectures = activeTab === "practical" ? practicalLectures : theoreticalLectures;
  const accent = getSubjectAccent(subject.name);
  const IconComp = accent.icon;

  return (
    <div className="min-h-screen bg-background pb-32 pt-0">
      {/* ── Immersive Subject Hero ── */}
      <div className="relative hidden md:flex h-[380px] w-full overflow-hidden items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        <div className="container mx-auto px-6 relative z-20 max-md:pt-2 md:pt-20">
          <div className="flex flex-col gap-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 overflow-x-auto whitespace-nowrap no-scrollbar pb-1">
              <Link href="/modules" className="hover:text-white">Hub</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href={`/modules/${params.moduleId}`} className="hover:text-white">
                {subject.module?.name}
              </Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-primary">{subject.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl", accent.bgColor)}>
                  <IconComp className={cn("h-8 w-8", accent.iconColor)} />
                </div>
                <div>
                   <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                     {subject.name}.
                   </h1>
                   <p className="text-sm font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mt-1">
                     {subject.lectures.length} Lectures
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Title Row */}
      <div className="md:hidden px-6 pb-2 pt-2 space-y-3">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-white/40 overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link href="/modules" className="hover:text-white">Hub</Link>
          <ChevronRight className="h-1.5 w-1.5 text-white/20" />
          <Link href={`/modules/${params.moduleId}`} className="hover:text-white truncate max-w-[80px]">
            {subject.module?.name}
          </Link>
          <ChevronRight className="h-1.5 w-1.5 text-white/20" />
          <span className="text-primary truncate max-w-[120px]">{subject.name}</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-md", accent.bgColor)}>
            <IconComp className={cn("h-5.5 w-5.5", accent.iconColor)} />
          </div>
          <div>
             <h1 className="text-[20px] font-black text-white leading-none tracking-tight">
               {subject.name}.
             </h1>
             <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">
               {subject.lectures.length} Lectures
             </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {isAdmin && (
          <div className="mb-12">
            <LectureInlineManager
              subjectId={subject.id}
              initialLectures={subject.lectures.map((l: any) => ({ id: l.id, title: l.title, videoUrl: l.videoUrl }))}
            />
          </div>
        )}

        {/* ── Lectures Grid ── */}
        {/* ── Tabs & Filter ── */}
        <div className="mb-8">
           <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl w-fit">
              <Link 
                href={`?tab=lectures`}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === "lectures" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:text-white"
                )}
              >
                <BookOpen className="h-4 w-4" /> Lectures
              </Link>
              {practicalLectures.length > 0 && (
                <Link 
                  href={`?tab=practical`}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === "practical" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-white/40 hover:text-white"
                  )}
                >
                  <Microscope className="h-4 w-4" /> Practical
                </Link>
              )}
           </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-1.5 rounded-full", activeTab === "practical" ? "bg-indigo-500" : "bg-primary")} />
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeTab === "practical" ? "Clinical Sessions" : "Lecture Series"}
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">
                  {activeTab === "practical" ? "Procedure & Skill Training" : "Step-by-step Learning"}
                </p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-white/40 hover:text-primary transition-all uppercase tracking-widest">
               <Clock className="h-4 w-4 text-primary" /> {currentLectures.length} Items
            </button>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentLectures.map((lecture: any, idx: number) => (
                  <Link
                    key={lecture.id}
                    href={`/modules/${params.moduleId}/lectures/${lecture.id}`}
                    className="group relative flex flex-col bg-card border border-border/50 rounded-xl md:rounded-2xl p-3 md:p-4.5 transition-all active:scale-[0.98] shadow-md overflow-hidden"
                  >
                  <div className="flex-1 flex gap-3 md:gap-4.5">
                    <div className={cn(
                      "h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-lg md:rounded-xl flex items-center justify-center transition-all",
                      activeTab === "practical" ? "bg-indigo-500/10 text-indigo-500" : "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/40 group-hover:text-primary"
                    )}>
                      {activeTab === "practical" ? <Microscope className="h-4.5 w-4.5 md:h-5.5 md:w-5.5" /> : <PlayCircle className="h-4.5 w-4.5 md:h-5.5 md:w-5.5" />}
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="text-[13px] md:text-[15px] font-black dark:text-white text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {lecture.title}
                      </h3>
                      <div className="flex items-center gap-2.5">
                         <p className="text-[8px] md:text-[9px] font-bold dark:text-white/20 text-slate-400 uppercase tracking-widest">
                           {activeTab === "practical" ? "Skill" : "Step"} {idx + 1}
                         </p>
                         <div className="flex items-center gap-1.5">
                           {lecture._count.questions > 0 && <HelpCircle className="h-2.5 w-2.5 text-primary/45" />}
                           {lecture.files.length > 0 && <FileText className="h-2.5 w-2.5 text-blue-400/45" />}
                           {lecture.checklist && <Shield className="h-2.5 w-2.5 text-emerald-400/45" />}
                         </div>
                      </div>
                    </div>
                  </div>
                </Link>
            ))}
          </div>

          {subject.lectures.length === 0 && (
            <div className="py-24 text-center rounded-[40px] border border-dashed border-white/5 bg-white/[0.01]">
              <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6 text-primary/30">
                <BookOpen className="h-8 w-8" />
              </div>
              <p className="text-white/30 font-black uppercase tracking-widest text-sm">Curriculum is being prepared.</p>
              <p className="text-white/10 text-xs mt-1">Check back soon for new academic lectures.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
