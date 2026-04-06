import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LectureClient } from "@/components/content/LectureClient";

export default async function LectureQuestionsPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();
  await trackLectureView(session.user.id, params.lectureId, "questions");

  const hub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/modules">Modules</Link>
        <span>/</span>
        <Link href={`/modules/${params.moduleId}`} className="truncate max-w-[100px]">
          {lecture.subject.module.name}
        </Link>
        <span>/</span>
        <Link href={`/modules/${params.moduleId}/subjects/${lecture.subjectId}`} className="truncate max-w-[100px]">
          {lecture.subject.name}
        </Link>
        <span>/</span>
        <Link href={hub} className="truncate max-w-[140px]">
          {lecture.title}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Questions</span>
      </nav>

      <h1 className="mb-6 font-display text-xl font-bold md:text-2xl">Questions — {lecture.title}</h1>

      {lecture.questions.length > 0 ? (
        <LectureClient flashcards={[]} questions={lecture.questions as any} mode="questions" />
      ) : (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No questions for this lecture yet.
        </p>
      )}

      <div className="mt-8">
        <Link href={hub} className="text-sm font-medium text-primary hover:underline">
          ← Back to lecture sections
        </Link>
      </div>
    </div>
  );
}
