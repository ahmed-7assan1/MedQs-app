import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRankInfo } from "@/lib/engagement";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await Promise.resolve(params);
  const targetId = userId === "me" ? session.user.id : userId;
  const info = await getUserRankInfo(targetId);
  if (!info) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(info);
}
