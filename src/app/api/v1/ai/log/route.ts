import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, message, reply, context } = await req.json();

    // Log the interaction to the database
    // We'll use a generic AI interaction log table or create one if it doesn't exist
    // For now, we'll log it as a System Activity or a dedicated AI log if available
    
    const log = await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AI_INTERACTION",
        entity: "DR_Q",
        details: {
          fullMessage: message,
          fullReply: reply,
          context: context,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error) {
    console.error("[AI_LOG_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
