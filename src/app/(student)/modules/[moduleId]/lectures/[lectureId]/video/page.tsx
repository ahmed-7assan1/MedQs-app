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
    <div className="min-h-screen bg-[#07080f] animate-in fade-in duration-500 overflow-x-hidden pt-16">
      <div className="w-full max-w-[1800px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
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
    </div>
  );
}

