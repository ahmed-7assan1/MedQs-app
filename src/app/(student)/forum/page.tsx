import { ForumClient } from "@/components/forum/ForumClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ForumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope || !scope.universityId) {
    redirect("/profile?error=university_required");
  }

  const { universityId, semesterId, userId, role } = scope;

  const where = isAdminRole(role)
    ? { universityId }
    : {
        universityId,
        OR: [
          { type: "GLOBAL" as const },
          { type: "SEMESTER" as const, semesterId: semesterId ?? undefined },
          { type: "PRIVATE" as const, members: { some: { userId } } },
        ],
        NOT: { status: "CLOSED" as const },
      };

  const forums = await prisma.forum.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <ForumClient 
      forums={forums as any} 
      currentUserId={userId} 
      currentUserRole={role}
      currentUserUniversityId={universityId}
    />
  );
}
