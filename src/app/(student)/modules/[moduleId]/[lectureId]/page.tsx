import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

/** Old URL: /modules/:moduleId/:lectureId → /modules/:moduleId/lectures/:lectureId */
export default async function LegacyModuleLectureRedirect({
  params,
}: {
  params: { moduleId: string; lectureId: string };
}) {
  const { moduleId, lectureId } = params;
  if (lectureId === "subjects" || lectureId === "lectures") notFound();

  const lecture = await prisma.lecture.findFirst({
    where: { id: lectureId, subject: { moduleId } },
    select: { id: true },
  });
  if (!lecture) notFound();
  redirect(`/modules/${moduleId}/lectures/${lectureId}`);
}
