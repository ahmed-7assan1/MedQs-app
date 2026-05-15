import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/dashboard-app";

  if (code) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // For password recovery, skip Prisma sync and go directly to the reset page
      if (type === "recovery") {
        return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
      }

      // Synchronize the user to Prisma for all other flows (login, signup, magic link)
      try {
        await fetch(`${requestUrl.origin}/api/v1/auth/sync`, { 
          method: "POST",
          headers: {
            cookie: request.headers.get("cookie") || ""
          }
        });
      } catch (syncError) {
        console.error("Failed to sync user in callback:", syncError);
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${requestUrl.origin}/auth?mode=login&error=auth-code-error`);
}
