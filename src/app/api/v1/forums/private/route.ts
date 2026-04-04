import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreatePrivateForumSchema = z.object({
  name:       z.string().min(1).max(100).trim(),
  inviteIds:  z.array(z.string()).max(20).default([]),
  inviteTokens: z.array(z.string().min(2)).max(20).default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreatePrivateForumSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const { name, inviteIds, inviteTokens } = parsed.data;

  // Create private forum
  const forum = await prisma.forum.create({
    data: {
      name,
      type: "PRIVATE",
      status: "OPEN",
      createdBy: session.user.id,
      members: {
        create: { userId: session.user.id }, // owner is automatically a member
      },
    },
  });

  // Process invites by student ID and username/nickname/full name
  const normalizedTokens = [...inviteIds, ...inviteTokens]
    .map((t) => t.trim())
    .filter(Boolean);
  const deduped = Array.from(new Set(normalizedTokens));
  const results: { token: string; status: string }[] = [];

  for (const token of deduped) {
    const invitee = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId: token },
          { nickname: { equals: token, mode: "insensitive" } },
          { name: { equals: token, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!invitee) {
      results.push({ token, status: "not_found" });
      continue;
    }

    if (invitee.id === session.user.id) {
      results.push({ token, status: "self" });
      continue;
    }

    // Create invite
    await prisma.privateForumInvite.upsert({
      where: { forumId_receiverId: { forumId: forum.id, receiverId: invitee.id } },
      create: {
        forumId:    forum.id,
        senderId:   session.user.id,
        receiverId: invitee.id,
        status:     "pending",
      },
      update: { status: "pending" },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        title:  "Forum invitation",
        body:   `You've been invited to join "${name}"`,
        channel: "FORUM",
      },
    });

    results.push({ token, status: "invited" });
  }

  return NextResponse.json({ forum, results }, { status: 201 });
}
