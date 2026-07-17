import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/components/modules/TopBar";
import PageContainer from "@/components/modules/PageContainer";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/markdown-components";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { NotebookPen } from "lucide-react";

export default async function LectureNotesPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  const baseHub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;
  if (!lecture) redirect(baseHub);
  await trackLectureView(session.user.id, params.lectureId, "notes");

  const md = lecture.notesMarkdown?.trim();
  if (!md) redirect(baseHub);

  const base = `/modules/${params.moduleId}/lectures/${params.lectureId}`;

  return (
    <div className="min-h-screen bg-background">
      <TopBar userName={session?.user?.name} userImage={session?.user?.image} />
      <PageContainer>
        <div className="pt-6">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/modules" className="hover:text-foreground">
              Modules
            </Link>
            <span>/</span>
            <Link href={`/modules/${params.moduleId}`} className="hover:text-foreground truncate max-w-[120px]">
              {lecture.subject.module.name}
            </Link>
            <span>/</span>
            <Link href={base} className="hover:text-foreground truncate max-w-[160px]">
              {lecture.title}
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Notes</span>
          </nav>

          <div className="mb-6 flex items-center gap-2">
            <NotebookPen className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold md:text-3xl">Lecture notes</h1>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">High-yield summary for this session.</p>

          <div className="rounded-2xl border border-border bg-card p-5 md:p-8">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-p:leading-relaxed">
              <ReactMarkdown components={markdownComponentsWithImages}>{enhancePlainImageUrls(md)}</ReactMarkdown>
            </div>
          </div>

          <p className="mt-6 text-center">
            <Link href={base} className="text-sm text-primary hover:underline">
              ← Back to lecture hub
            </Link>
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
