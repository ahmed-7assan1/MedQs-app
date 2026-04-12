import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LectureContentInlineManager } from "@/components/admin-inline/LectureContentInlineManager";
import { AdminToolsDrawer } from "@/components/admin-inline/AdminToolsDrawer";
import { LectureExperienceClient } from "@/components/content/LectureExperienceClient";

export default async function LectureHubPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();
  await trackLectureView(session.user.id, params.lectureId, "hub");

  // Plain JSON so the client bundle never receives non-serializable Prisma values (avoids RSC/hydration edge cases).
  const lectureClient = JSON.parse(JSON.stringify(lecture)) as typeof lecture;

  return (
    <div className="min-h-0 flex-1">
      <nav className="mx-auto w-full max-w-6xl px-3 pt-4 text-sm text-muted-foreground sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/modules" className="hover:text-foreground">
            Modules
          </Link>
          <span>/</span>
          <Link href={`/modules/${params.moduleId}`} className="hover:text-foreground truncate max-w-[140px]">
            {lecture.subject.module.name}
          </Link>
          <span>/</span>
          <Link
            href={`/modules/${params.moduleId}/subjects/${lecture.subjectId}`}
            className="hover:text-foreground truncate max-w-[140px]"
          >
            {lecture.subject.name}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground truncate max-w-[220px]">{lecture.title}</span>
        </div>
      </nav>

      {isAdmin ? (
        <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-6">
          <AdminToolsDrawer title="Doctor tools (this lecture)">
            <LectureContentInlineManager
              lectureId={lecture.id}
              initialFlashcards={lecture.flashcards.map((f: any) => ({ id: f.id, front: f.front, back: f.back }))}
              initialFiles={lecture.files.map((f: any) => ({ id: f.id, name: f.name, url: f.url, mimeType: f.mimeType }))}
              initialNotes={lecture.notesMarkdown ?? ""}
              initialVideos={lecture.videos.map((v: any) => ({
                id: v.id,
                title: v.title,
                url: v.url,
                sharingEnabled: v.sharingEnabled,
                likesCount: v.likesCount,
                commentsCount: v.commentsCount,
                sharesCount: v.sharesCount,
              }))}
            />
          </AdminToolsDrawer>
        </div>
      ) : null}

      <LectureExperienceClient lecture={lectureClient as any} moduleId={params.moduleId} />
    </div>
  );
}
