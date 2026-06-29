import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import webpush from "web-push";

// Initialize safely to avoid build errors on Vercel
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@medqs.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const POST = withAdmin(async ({ session, req }) => {
  const currentUser = session?.user as any;
  const userRole = currentUser?.role;

  const { title, body, icon, url, image, targetUserId } = await req.json();

  if (!title || !body) {
    return NextResponse.json(
      { error: "Title and body are required" },
      { status: 400 }
    );
  }

  // Build the notification payload
  const payload = JSON.stringify({
    title,
    body,
    icon: icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: url || "/",
    image: image || undefined,
    tag: `medqs-broadcast-${Date.now()}`,
  });

  // Determine target subscriptions
  const whereClause = targetUserId
    ? { userId: targetUserId }
    : currentUser?.role === "ADMIN" && currentUser?.semesterId
    ? { user: { semesterId: currentUser.semesterId } }
    : {};

  const subscriptions = await prisma.pushSubscription.findMany({
    where: whereClause,
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: true,
      successCount: 0,
      failCount: 0,
      message: "No subscribers found",
    });
  }

  let successCount = 0;
  let failCount = 0;
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        successCount++;
      } catch (err: any) {
        failCount++;
        // 410 Gone = subscription expired, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
        console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 40)}...`, err.statusCode);
      }
    })
  );

  // Cleanup stale subscriptions
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: { in: staleEndpoints } } })
      .catch(() => {});
  }

    return NextResponse.json({ success: true, successCount, failCount });
});

// GET - Returns subscriber count for admin dashboard
export const GET = withAdmin(async ({ session }) => {
  const currentUser = session?.user as any;

  const whereClause =
    currentUser?.role === "ADMIN" && currentUser?.semesterId
      ? { user: { semesterId: currentUser.semesterId } }
      : {};

  const count = await prisma.pushSubscription.count({ where: whereClause });
  return NextResponse.json({ count });
});
