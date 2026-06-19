import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      if (type === "recovery") {
        return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`);
      }

      try {
        await fetch(`${requestUrl.origin}/api/v1/auth/sync`, {
          method: "POST",
          headers: { cookie: request.headers.get("cookie") || "" }
        });
      } catch {}

      const onboardingDone = user.user_metadata?.onboarding_completed === true;
      if (!onboardingDone) {
        return NextResponse.redirect(`${requestUrl.origin}/complete-profile`);
      }
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth?mode=login&error=auth-code-error`);
}
