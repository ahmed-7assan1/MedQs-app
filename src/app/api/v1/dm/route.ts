import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** List messages between current user and another user (newest last). */
export async function GET(req: NextRequest) {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withId = req.nextUrl.searchParams.get("withUserId")?.trim();
  if (!withId) return NextResponse.json({ error: "withUserId required" }, { status: 400 });
  if (withId === me) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: withId },
        { senderId: withId, receiverId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      senderId: true,
      receiverId: true,
      read: true,
      createdAt: true,
    },
  });

  await prisma.directMessage.updateMany({
    where: { senderId: withId, receiverId: me, read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const toRaw = o.toUserId ?? o.receiverId;
  const to = typeof toRaw === "string" ? toRaw.trim() : "";
  const bodyRaw = o.body ?? o.message ?? o.text;
  const text = typeof bodyRaw === "string" ? bodyRaw.trim() : "";
  if (!to || to === me) return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  if (!text || text.length > 8000) return NextResponse.json({ error: "Message too long or empty" }, { status: 400 });

  const senderOk = await prisma.user.findUnique({ where: { id: me }, select: { id: true } });
  if (!senderOk) return NextResponse.json({ error: "Session user missing in database" }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id: to }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const msg = await prisma.directMessage.create({
      data: { senderId: me, receiverId: to, body: text },
      select: {
        id: true,
        body: true,
        senderId: true,
        receiverId: true,
        read: true,
        createdAt: true,
      },
    });
    return NextResponse.json(msg, { status: 201 });
  } catch (e) {
    console.error("[dm] create failed", e);
    return NextResponse.json({ error: "Could not send message" }, { status: 500 });
  }
}
