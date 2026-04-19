import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video, ChevronRight, Clock, Box, GraduationCap } from "lucide-react";
import { LectureVideoStudio } from "@/components/content/LectureVideoStudio";

function toProperCase(str: string) {
  return str.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

export default async function LectureVideoPage({
  params,
  searchParams,
}: {
  params: { moduleId: string; lectureId: string };
  searchParams?: { v?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const scope = await getSessionScope(session);
  const isAdmin = isAdminRole(scope?.role);

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

  const videoIds = videos.map((v: any) => v.id);
  const likedRows =
    videoIds.length > 0
      ? await prisma.lectureVideoLike.findMany({
        where: { userId: session.user.id, videoId: { in: videoIds } },
        select: { videoId: true },
      })
      : [];
  const likedSet = new Set(likedRows.map((r) => r.videoId));

  return (
    <div className="mx-auto max-w-[1248px] px-4 md:px-6 py-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* 1. BREADCRUMBS */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] font-normal text-muted-foreground/60">
        <Link href="/modules" className="hover:text-primary transition-colors">Modules</Link>
        <span className="text-[11px] opacity-30 select-none">›</span>
        <Link href={`/modules/${params.moduleId}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
          {lecture.subject.module.name}
        </Link>
        <span className="text-[11px] opacity-30 select-none">›</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            {lecture.subject.name}
          </span>
          <span className="font-medium text-foreground">{toProperCase(lecture.title)}</span>
        </div>
      </nav>

      {/* 2. PAGE TITLE & METADATA */}
      <div className="mb-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground leading-[1.2]">
          {toProperCase(lecture.title)}
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground ring-1 ring-border/50">
            <GraduationCap className="h-3.5 w-3.5" />
            {lecture.subject.name}
          </div>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground font-medium">
            <div className="flex items-center gap-1">
              {videos.map((_: any, idx: number) => (
                <div key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <span>{videos.length} {videos.length === 1 ? 'Section' : 'Sections'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium">
            <Clock className="h-4 w-4 opacity-40" />
            00:00 {/* Dynamic duration could be added later if stored */}
          </div>
        </div>
      </div>

      {videos.length > 0 ? (
        <LectureVideoStudio
          lectureId={lecture.id}
          initialVideos={videos.map((v: any) => ({
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
          isAdmin={isAdmin}
          currentUserId={session.user.id}
          hubUrl={hub}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-16">
          <Video className="h-10 w-10 text-muted-foreground opacity-25" />
          <p className="text-sm text-muted-foreground">No videos for this lecture</p>
          <div className="mt-8">
            <Link href={hub} className="text-sm font-medium text-primary hover:underline">
              ← Back to lecture sections
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

