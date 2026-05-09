import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { CommunityChatClient } from "@/components/forum/CommunityChatClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Discussion Group • MedOneX",
  description: "Real-time community discussion for all students in your university.",
};

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope?.universityId) redirect("/profile?error=university_required");

  const { universityId, userId } = scope;

  // Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true },
  });

  // Fetch university name
  const university = await prisma.university.findUnique({
    where: { id: universityId },
    select: { name: true },
  });

  // Find or auto-create the GLOBAL community forum
  let forum = await prisma.forum.findFirst({
    where: { universityId, type: "GLOBAL" },
    select: { id: true },
  });

  if (!forum) {
    forum = await prisma.forum.create({
      data: {
        name: "Community Discussion",
        type: "GLOBAL",
        universityId,
      },
      select: { id: true },
    });
  }

  // Fetch latest 60 chat messages
  const rawMessages = await prisma.post.findMany({
    where: {
      forumId: forum.id,
      isChatMessage: true,
      isForumPost: false,
    },
    orderBy: { createdAt: "asc" },
    take: 60,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          rank: { select: { label: true, badge: true } },
        },
      },
    },
  });

  return (
    <CommunityChatClient
      currentUserId={userId}
      currentUserName={user?.name || "User"}
      currentUserImage={user?.image}
      universityName={university?.name}
      initialMessages={rawMessages as any}
    />
  );
}
