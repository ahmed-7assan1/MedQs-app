import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import OneXCommunity from "@/components/social/OneXCommunity";
import { SocialMobileWrapper } from "@/components/community-mobile/SocialMobileWrapper";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "OneX Community",
  description: "Connect, discuss, and learn together with your university community.",
};

function isMobileUserAgent(ua: string): boolean {
  return /android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini|mobile/i.test(ua);
}

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
  { revalidate: 60 }
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
  { revalidate: 60 }
);

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope?.universityId) redirect("/profile?error=university_required");

  const { universityId, semesterId, userId, role } = scope;
  const userName = session.user.name ?? "Student";
  const userImage = session.user.image ?? undefined;

  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const isMobile = isMobileUserAgent(ua);

  if (isMobile) {
    return (
      <SocialMobileWrapper
        currentUserId={userId}
        currentUserName={userName}
        currentUserImage={userImage ?? null}
        isAdmin={isAdminRole(role)}
      >
        <OneXCommunity
          circles={[]}
          rooms={[]}
          currentUserId={userId}
          currentUserName={userName}
          currentUserImage={userImage ?? undefined}
          currentUserRole={role}
          currentUserUniversityId={universityId}
        />
      </SocialMobileWrapper>
    );
  }

  const [forums, rooms] = await Promise.all([
    getCachedForums(universityId, semesterId ?? null, userId, isAdminRole(role)),
    getCachedRooms(universityId, userId),
  ]);

  const roomsWithMeta = rooms.map((r: any) => ({
    ...r,
    isMember: r.members.length > 0,
    isOwner: r.ownerId === userId,
  }));

  return (
    <SocialMobileWrapper
      currentUserId={userId}
      currentUserName={userName}
      currentUserImage={userImage ?? null}
      isAdmin={isAdminRole(role)}
    >
      <OneXCommunity
        circles={forums as any}
        rooms={roomsWithMeta as any}
        currentUserId={userId}
        currentUserName={userName}
        currentUserImage={userImage ?? undefined}
        currentUserUniversityId={universityId}
      />
    </SocialMobileWrapper>
  );
}
