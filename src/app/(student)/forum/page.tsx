import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ForumClient } from "@/components/forum/ForumClient";

export default async function ForumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const forums = await prisma.forum.findMany({
    where: {
      OR: [
        { type: "GLOBAL" },
        { type: "SEMESTER", semesterId: user?.semesterId ?? undefined },
        { type: "PRIVATE", members: { some: { userId: session.user.id } } },
      ],
      NOT: { status: "CLOSED" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return (
    <ForumClient
      forums={forums as any}
      currentUserId={session.user.id}
    />
  );
}
