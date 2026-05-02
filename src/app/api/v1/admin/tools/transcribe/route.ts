import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transcribeMedia } from "@/lib/assembly-ai";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPER_ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fileUrl } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });

    const transcript = await transcribeMedia(fileUrl);
    return NextResponse.json({ transcript });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
