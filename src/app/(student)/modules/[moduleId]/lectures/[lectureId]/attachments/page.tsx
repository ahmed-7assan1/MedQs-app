import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Paperclip, FileText } from "lucide-react";

export default async function LectureAttachmentsPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();
  await trackLectureView(session.user.id, params.lectureId, "attachments");

  const hub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
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
        <span className="font-medium text-foreground">Attachments</span>
      </nav>

      <h1 className="mb-6 font-display text-xl font-bold md:text-2xl">Attachments — {lecture.title}</h1>

      {lecture.files.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{lecture.files.length} file(s)</span>
          </div>
          <div className="space-y-1.5">
            {lecture.files.map((file: any) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm text-primary group-hover:underline">{file.name}</span>
                <span className="flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                  {file.mimeType.split("/")[1] ?? "file"}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No attachments for this lecture.
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
