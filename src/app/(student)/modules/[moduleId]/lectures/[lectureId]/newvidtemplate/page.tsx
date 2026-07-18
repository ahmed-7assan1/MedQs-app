import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { YouTubeStyleVideoPage } from "@/components/content/YouTubeStyleVideoPage";

export const dynamic = "force-dynamic";

export default async function LectureNewVidTemplatePage({
  params,
  searchParams,
}: {
  params: { moduleId: string; lectureId: string };
  searchParams?: { v?: string };
}) {
  /* ── Auth ── */
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  const isAdmin = isAdminRole(scope?.role);

  /* ── Data ── */
  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();

  await trackLectureView(session.user.id, params.lectureId, "video");

  /* Build normalised videos array (same logic as video/page.tsx) */
  const videos =
    lecture.videos.length > 0
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

  /* Fetch like states for the current user */
  const videoIds = videos.map((v: any) => v.id);
  const likedRows =
    videoIds.length > 0
      ? await prisma.lectureVideoLike.findMany({
          where: { userId: session.user.id, videoId: { in: videoIds } },
          select: { videoId: true },
        })
      : [];
  const likedSet = new Set(likedRows.map((r) => r.videoId));

  const hubUrl = `/modules/${params.moduleId}/lectures/${params.lectureId}`;

  return (
    <YouTubeStyleVideoPage
      lectureId={lecture.id}
      lectureTitle={lecture.title}
      moduleId={params.moduleId}
      initialVideos={videos.map((v: any) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        sourceType: v.sourceType ?? "external",
        sharingEnabled: v.sharingEnabled ?? true,
        likesCount: v.likesCount ?? 0,
        commentsCount: v.commentsCount ?? 0,
        sharesCount: v.sharesCount ?? 0,
        likedByMe: likedSet.has(v.id),
      }))}
      selectedVideoId={searchParams?.v}
      isAdmin={isAdmin}
      currentUserId={session.user.id}
      userName={session.user.name}
      userImage={session.user.image}
      hubUrl={hubUrl}
    />
  );
}
