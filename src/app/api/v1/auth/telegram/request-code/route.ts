import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Telegraf } from "telegraf";
import { generateVerificationCode } from "@/lib/telegram-auth";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

    // Find bot user by phone number
    // We assume the student has already "Linked via Phone" in the bot
    const botUser = await (prisma as any).botUser.findFirst({
      where: { phoneNumber: cleanPhone }
    });

    if (!botUser) {
      return NextResponse.json({ 
        error: "User not found in Bot database. Please 'Start' the bot and share your contact first." 
      }, { status: 404 });
    }

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to BotAuth
    await (prisma as any).botAuth.upsert({
      where: { telegramId: botUser.telegramId },
      update: { code, expiresAt },
      create: { telegramId: botUser.telegramId, code, expiresAt }
    });

    // Send code via bot
    await bot.telegram.sendMessage(
      botUser.telegramId,
      `🔑 Your MedOneX Verification Code is: \`${code}\`\n\n` +
      `Enter this code on the registration page to verify your account.\n` +
      `_This code expires in 5 minutes._`,
      { parse_mode: "Markdown" }
    );

    return NextResponse.json({ success: true, message: "Verification code sent to Telegram" });
  } catch (error: any) {
    console.error("[REQUEST_CODE] Error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
