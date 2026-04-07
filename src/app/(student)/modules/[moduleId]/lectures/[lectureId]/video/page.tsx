import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video } from "lucide-react";
import { LectureVideoStudio } from "@/components/content/LectureVideoStudio";

export default async function LectureVideoPage({
  params,
  searchParams,
}: {
  params: { moduleId: string; lectureId: string };
  searchParams?: { v?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();
  await trackLectureView(session.user.id, params.lectureId, "video");

  const hub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;
  const selected = searchParams?.v;
  const videos = lecture.videos.length
    ? lecture.videos
    : lecture.videoUrl
      ? [
          {
            id: "legacy-single",
            title: "Main lecture video",
            url: lecture.videoUrl,
            sourceType: "external",
            sharingEnabled: true,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            sortOrder: 1,
            lectureId: lecture.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      : [];

  const videoIds = videos.map((v) => v.id);
  const likedRows =
    videoIds.length > 0
      ? await prisma.lectureVideoLike.findMany({
          where: { userId: session.user.id, videoId: { in: videoIds } },
          select: { videoId: true },
        })
      : [];
  const likedSet = new Set(likedRows.map((r) => r.videoId));

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

      {videos.length > 0 ? (
        <LectureVideoStudio
          lectureId={lecture.id}
          initialVideos={videos.map((v) => ({
            id: v.id,
            title: v.title,
            url: v.url,
            sourceType: v.sourceType,
            sharingEnabled: v.sharingEnabled,
            likesCount: v.likesCount,
            commentsCount: v.commentsCount,
            sharesCount: v.sharesCount,
            likedByMe: likedSet.has(v.id),
          }))}
          selectedVideoId={selected}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-16">
          <Video className="h-10 w-10 text-muted-foreground opacity-25" />
          <p className="text-sm text-muted-foreground">No videos for this lecture</p>
          <p className="text-xs text-muted-foreground opacity-70">Doctors can add multiple videos from the lecture hub or inline edit.</p>
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
