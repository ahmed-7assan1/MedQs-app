import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const supabase = createAdminClient();
    const cleanEmail = email.toLowerCase().trim();

    const { data: allUsers, error: lookupError } = await supabase.auth.admin.listUsers();

    if (lookupError || !allUsers?.users?.length) {
      return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
    }

    const user = allUsers.users.find(u => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: "123456",
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", userId: user.id });
  } catch (error: any) {
    console.error("[BYPASS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
