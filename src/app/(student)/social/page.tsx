import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { SocialClient } from "@/components/social/SocialClient";
import { unstable_cache } from "next/cache";

// Keep page dynamic since it reads auth cookies per user
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Social • MedOneX",
  description: "Connect, discuss, and learn together with your university community.",
};

// ─── Cached DB Queries (60s TTL) ─────────────────────────────────────────────
// These queries are shared across ALL students of the same university.
// Instead of hitting the DB for every student, the result is cached in
// Vercel's Data Cache for 60 seconds. Firebase handles real-time updates.

const getCachedForums = unstable_cache(
  async (universityId: string, semesterId: string | null, userId: string, isAdmin: boolean) => {
    const forumWhere = isAdmin
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

    return prisma.forum.findMany({
      where: forumWhere,
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { posts: true } } },
    });
  },
  ["social-forums"],
  { revalidate: 60, tags: ["forums"] }
);

const getCachedRooms = unstable_cache(
  async (universityId: string, userId: string) => {
    return (prisma as any).studyRoom.findMany({
      where: { universityId },
      include: {
        _count: { select: { members: true, posts: true } },
        members: {
          where: { userId },
          select: { id: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  },
  ["social-rooms"],
  { revalidate: 60, tags: ["rooms"] }
);

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope?.universityId) redirect("/profile?error=university_required");

  const { universityId, semesterId, userId, role } = scope;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true },
  });

  const [forums, rooms] = await Promise.all([
    getCachedForums(universityId, semesterId ?? null, userId, isAdminRole(role)),
    getCachedRooms(universityId, userId),
  ]);

  // Mark isMember and isOwner
  const roomsWithMeta = rooms.map((r: any) => ({
    ...r,
    isMember: r.members.length > 0,
    isOwner: r.ownerId === userId,
  }));

  return (
    <SocialClient
      circles={forums as any}
      rooms={roomsWithMeta as any}
      currentUserId={userId}
      currentUserName={user?.name ?? undefined}
      currentUserImage={user?.image ?? undefined}
      currentUserRole={role}
      currentUserUniversityId={universityId}
    />
  );
}
