import { auth } from "@/lib/auth";
import { getLectureInModule, getVideoEmbedInfo } from "@/lib/lecture-navigation";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video, ExternalLink } from "lucide-react";

export default async function LectureVideoPage({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();

  const hub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;
  const videoEmbed = lecture.videoUrl ? getVideoEmbedInfo(lecture.videoUrl) : null;

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
        <span className="font-medium text-foreground">Video</span>
      </nav>

      <h1 className="mb-6 font-display text-xl font-bold md:text-2xl">Video — {lecture.title}</h1>

      {videoEmbed ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              src={videoEmbed.embedUrl}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
              className="border-0"
            />
          </div>
          <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5 text-white/30" />
              <span className="text-xs text-white/40">{videoEmbed.type}</span>
            </div>
            {lecture.videoUrl && (
              <a
                href={lecture.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60"
              >
                <ExternalLink className="h-3 w-3" /> Open original
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-16">
          <Video className="h-10 w-10 text-muted-foreground opacity-25" />
          <p className="text-sm text-muted-foreground">No video for this lecture</p>
          <p className="text-xs text-muted-foreground opacity-70">YouTube, Drive, Telegram, or direct video URL</p>
        </div>
      )}

      <div className="mt-8">
        <Link href={hub} className="text-sm font-medium text-primary hover:underline">
          ← Back to lecture sections
        </Link>
      </div>
    </div>
  );
}
