import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video, FileQuestion, Layers, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function SubjectLecturesPage({
  params,
}: {
  params: { moduleId: string; subjectId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/modules" className="hover:text-foreground">
          Modules
        </Link>
        <span>/</span>
        <Link href={`/modules/${params.moduleId}`} className="hover:text-foreground truncate max-w-[140px]">
          {subject.module.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground truncate max-w-[200px]">{subject.name}</span>
      </nav>

      <h1 className="mb-2 font-display text-2xl font-bold md:text-3xl">{subject.name}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Choose a lecture, then pick video, files, flashcards, or questions.</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {subject.lectures.map((lecture) => (
          <Link
            key={lecture.id}
            href={`/modules/${params.moduleId}/lectures/${lecture.id}`}
            className={cn(
              "surface-card-subtle group flex items-center gap-3 px-4 py-3 transition-all",
              "hover:border-primary/45 hover:shadow-md"
            )}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
              <Video className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{lecture.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {lecture._count.questions > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <FileQuestion className="h-3 w-3" />
                    {lecture._count.questions}
                  </span>
                )}
                {lecture._count.flashcards > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    {lecture._count.flashcards}
                  </span>
                )}
                {lecture.files.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {lecture.files.length}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {subject.lectures.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No lectures in this subject yet.
        </div>
      )}
    </div>
  );
}
