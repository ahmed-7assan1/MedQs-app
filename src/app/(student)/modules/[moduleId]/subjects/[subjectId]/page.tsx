import { 
  Video, FileQuestion, Layers, FileText, ChevronRight, 
  ArrowLeft, Clock, PlayCircle, BookOpen, GraduationCap,
  Microscope, Brain, Bone, Shield, Pill, Activity, HelpCircle,
  FlaskConical, Dna, Atom
} from "lucide-react";

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
}: {
  params: { moduleId: string; subjectId: string };
}) {
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
        },
      },
    },
  });

  if (!subject) notFound();
  const accent = getSubjectAccent(subject.name);
  const IconComp = accent.icon;

  return (
    <div className="min-h-screen bg-[#07080f] pb-32 pt-0">
      {/* ── Immersive Subject Hero ── */}
      <div className="relative h-[380px] w-full overflow-hidden flex items-center">
        {/* Dynamic Background Gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-b via-transparent to-[#07080f] z-10", accent.bgColor.replace("/10", "/20"))} />
        
        {/* Texture & Glow */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className={cn("absolute top-0 right-0 w-1/2 h-full blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 opacity-20", accent.bgColor)} />

        <div className="container mx-auto px-6 relative z-20 pt-20">
          <div className="flex flex-col gap-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <Link href="/modules" className="hover:text-white transition-colors">Hub</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/modules/${params.moduleId}`} className="hover:text-white transition-colors truncate max-w-[120px]">
                {subject.module?.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary truncate max-w-[150px]">{subject.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl", accent.bgColor)}>
                    <IconComp className={cn("h-8 w-8", accent.iconColor)} />
                  </div>
                  <div className="space-y-0.5">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                      {subject.name}.
                    </h1>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest">
                      {subject.lectures.length} Academic Lectures
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Circle */}
              <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="text-right">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Subject Focus</p>
                    <p className="text-sm font-black text-white">Medical Sciences</p>
                 </div>
                 <div className="h-8 w-px bg-white/10" />
                 <div className="h-10 w-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {isAdmin && (
          <div className="mb-12">
            <LectureInlineManager
              subjectId={subject.id}
              initialLectures={subject.lectures.map((l) => ({ id: l.id, title: l.title, videoUrl: l.videoUrl }))}
            />
          </div>
        )}

        {/* ── Lectures Grid ── */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Lecture Series</h2>
                <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Step-by-step Learning</p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest">
               <Clock className="h-4 w-4 text-primary" /> Latest Updates
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subject.lectures.map((lecture, idx) => (
              <Link
                key={lecture.id}
                href={`/modules/${params.moduleId}/lectures/${lecture.id}`}
                className="group relative flex flex-col bg-[#131220] border border-white/5 rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 overflow-hidden"
              >
                {/* Index Badge */}
                <div className="absolute top-4 right-4 text-[40px] font-black text-white/[0.02] group-hover:text-primary/10 transition-colors leading-none">
                  {idx + 1}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {lecture.title.toLowerCase()}
                    </h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Unit {idx + 1}</p>
                  </div>
                </div>

                {/* Meta Row */}
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-3">
                   {lecture._count.questions > 0 && (
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30" title="Quiz Items">
                        <HelpCircle className="h-3 w-3" />
                        {lecture._count.questions}
                     </div>
                   )}
                   {lecture._count.flashcards > 0 && (
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30" title="Flashcards">
                        <Layers className="h-3 w-3" />
                        {lecture._count.flashcards}
                     </div>
                   )}
                   {lecture.files.length > 0 && (
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30" title="Resources">
                        <FileText className="h-3 w-3" />
                        {lecture.files.length}
                     </div>
                   )}
                   
                   <div className="ml-auto h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="h-4 w-4" />
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
