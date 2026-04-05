import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DirectMessageClient } from "@/components/messages/DirectMessageClient";
import { StudentPageShell } from "@/components/layout/StudentPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { userId: string };

export default async function DirectMessagesPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { userId: rawPeer } = await Promise.resolve(params);
  const peerId = String(rawPeer ?? "").trim();
  const session = await auth();
  const meId = session?.user?.id;
  if (!meId) redirect("/login");
  if (!peerId || peerId === meId) redirect("/forum");

  const peer = await prisma.user
    .findUnique({
      where: { id: peerId },
      select: { id: true, name: true },
    })
    .catch(() => null);
  if (!peer) notFound();

  return (
    <StudentPageShell
      maxWidthClass="max-w-3xl"
      eyebrow="Messages"
      title={peer.name ?? "Member"}
      subtitle="Private conversation"
    >
      <DirectMessageClient peerId={peer.id} peerName={peer.name ?? "Member"} meId={meId} />
    </StudentPageShell>
  );
}
