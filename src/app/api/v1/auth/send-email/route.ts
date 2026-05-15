import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { type, email, name } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: "Missing email or type" }, { status: 400 });
    }

    // Use Supabase Admin to generate a link for the user
    const { createClient: createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    if (type === "signup") {
      // Generate email confirmation link
      const { data, error } = await (supabase as any).auth.admin.generateLink({
        type: "signup",
        email,
        options: {
          redirectTo: `${req.nextUrl.origin}/auth/callback?next=/dashboard-app`,
        },
      });

      if (error) {
        console.error("[send-email] generateLink error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await sendVerificationEmail(email, data.properties?.action_link || data.action_link);
      return NextResponse.json({ success: true, type: "verification_sent" });
    }

    if (type === "recovery") {
      // Generate password reset link
      const { data, error } = await (supabase as any).auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${req.nextUrl.origin}/auth/callback?next=/reset-password`,
        },
      });

      if (error) {
        console.error("[send-email] generateLink error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await sendPasswordResetEmail(email, data.properties?.action_link || data.action_link);
      return NextResponse.json({ success: true, type: "reset_sent" });
    }

    if (type === "welcome") {
      const displayName = name || email.split("@")[0];
      await sendWelcomeEmail(email, displayName);
      return NextResponse.json({ success: true, type: "welcome_sent" });
    }

    return NextResponse.json({ error: "Unknown email type" }, { status: 400 });

  } catch (err: any) {
    console.error("[send-email] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
