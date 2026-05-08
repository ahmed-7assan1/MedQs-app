import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      return new NextResponse("Invalid subscription", { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth: authKey } = keys;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh,
        auth: authKey,
      },
      create: {
        endpoint,
        p256dh,
        auth: authKey,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Subscribe] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
