import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { save } = await req.json(); // boolean true to save, false to unsave

    if (save) {
      await prisma.savedQuestion.upsert({
        where: {
          userId_questionId: {
            userId: session.user.id,
            questionId: params.id,
          },
        },
        create: {
          userId: session.user.id,
          questionId: params.id,
        },
        update: {},
      });
    } else {
      await prisma.savedQuestion.deleteMany({
        where: {
          userId: session.user.id,
          questionId: params.id,
        },
      });
    }

    return NextResponse.json({ success: true, saved: !!save });
  } catch (error) {
    console.error("Failed to toggle saved question:", error);
    return NextResponse.json(
      { error: "Failed to toggle saved question" },
      { status: 500 }
    );
  }
}
