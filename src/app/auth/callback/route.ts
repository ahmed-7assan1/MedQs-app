import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check if user has a profile in Prisma
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { universityId: true }
      });

      // If user is new or missing profile info, redirect to complete-profile
      if (!dbUser || !dbUser.universityId) {
        return NextResponse.redirect(`${requestUrl.origin}/complete-profile`);
      }
      
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-code-error`);
}
