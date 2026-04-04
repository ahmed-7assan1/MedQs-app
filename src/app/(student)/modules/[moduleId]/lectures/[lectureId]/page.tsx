import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video, FileText, Layers, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LectureHubPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();

  const base = `/modules/${params.moduleId}/lectures/${params.lectureId}`;
  const nQ = lecture.questions.length;
  const nF = lecture.flashcards.length;
  const nFiles = lecture.files.length;
  const hasVideo = Boolean(lecture.videoUrl?.trim());

  const items = [
    {
      href: `${base}/video`,
      label: "Video",
      desc: hasVideo ? "Watch the lesson" : "No video linked yet",
      icon: Video,
      available: hasVideo,
    },
    {
      href: `${base}/attachments`,
      label: "Attachments",
      desc: nFiles ? `${nFiles} file(s)` : "No files yet",
      icon: FileText,
      available: nFiles > 0,
    },
    {
      href: `${base}/flashcards`,
      label: "Flashcards",
      desc: nF ? `${nF} cards` : "No flashcards yet",
      icon: Layers,
      available: nF > 0,
    },
    {
      href: `${base}/questions`,
      label: "Questions",
      desc: nQ ? `${nQ} MCQs` : "No questions yet",
      icon: HelpCircle,
      available: nQ > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/modules" className="hover:text-foreground">
          Modules
        </Link>
        <span>/</span>
        <Link href={`/modules/${params.moduleId}`} className="hover:text-foreground truncate max-w-[120px]">
          {lecture.subject.module.name}
        </Link>
        <span>/</span>
        <Link
          href={`/modules/${params.moduleId}/subjects/${lecture.subjectId}`}
          className="hover:text-foreground truncate max-w-[120px]"
        >
          {lecture.subject.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground truncate max-w-[180px]">{lecture.title}</span>
      </nav>

      <h1 className="mb-2 font-display text-2xl font-bold md:text-3xl">{lecture.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Choose what you want to study in this lecture.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const inner = (
            <>
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
                  item.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {item.available ? (
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
              ) : null}
            </>
          );
          if (!item.available) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-start gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 opacity-75"
              >
                {inner}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
