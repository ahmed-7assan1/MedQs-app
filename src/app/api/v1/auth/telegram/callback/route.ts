import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = data;

    // 1. Verify Hash
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data)
      .filter(k => k !== 'hash')
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json({ error: "Invalid verification hash" }, { status: 400 });
    }

    // 2. Link account
    await (prisma.user as any).update({
      where: { id: session.user.id },
      data: {
        telegramId: id.toString(),
        telegramVerified: true,
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[TELEGRAM_CALLBACK] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
