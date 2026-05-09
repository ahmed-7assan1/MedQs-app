import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

    // Find bot user
    const botUser = await (prisma as any).botUser.findFirst({
      where: { phoneNumber: cleanPhone }
    });

    if (!botUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check code
    const authEntry = await (prisma as any).botAuth.findUnique({
      where: { telegramId: botUser.telegramId }
    });

    if (!authEntry || authEntry.code !== code || authEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Success - we don't mark as verified in User yet because the user might not be created.
    // We just return success so the frontend can proceed with registration.
    // The registration API will do the final check.
    
    return NextResponse.json({ 
      success: true, 
      telegramId: botUser.telegramId 
    });
  } catch (error: any) {
    console.error("[VERIFY_CODE] Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
