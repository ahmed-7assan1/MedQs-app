import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
import { redirect, notFound } from "next/navigation";
import { RoomDashboardClient } from "@/components/social/RoomDashboardClient";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope) redirect("/login");

  const { userId } = scope;
  const { roomId } = params;

  const room = await (prisma as any).studyRoom.findUnique({
    where: { id: roomId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, image: true, points: true, rank: { select: { label: true, badge: true } } },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      tasks: { orderBy: [{ completed: "asc" }, { createdAt: "desc" }], take: 50 },
      posts: {
        include: { 
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, likes: true } },
          sharedQuestion: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      schedule: true,
      _count: { select: { members: true, posts: true, tasks: true } },
    },
  });

  if (!room) notFound();

  const myMembership = room.members.find((m: { userId: string }) => m.userId === userId);
  const isMember = !!myMembership;
  const isOwner = room.ownerId === userId;

  // Private rooms: redirect non-members back to social
  if (!room.isPublic && !isMember) {
    redirect(`/social?join_code_required=${room.id}`);
  }

  return (
    <RoomDashboardClient
      room={room as any}
      currentUserId={userId}
      isMember={isMember}
      isOwner={isOwner}
    />
  );
}

