import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const GUEST_QUIZ_COOKIE = "medq_guest_quiz_uid";

const API_PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/v1/universities",
  "/api/v1/academic-years",
  "/api/v1/semesters",
  "/api/v1/ranks",
  "/api/v1/leaderboard",
];

const GUEST_BROWSABLE = ["/", "/modules", "/leaderboard", "/forum", "/profile"];
const AUTH_REQUIRED = ["/profile/edit", "/notifications", "/quiz", "/register"];

export async function middleware(req: NextRequest) {
  // Update Supabase session cookies
  let response = await updateSession(req);

  const { pathname } = req.nextUrl;

  // Create a minimal client to check session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // For role-based checks, we might need a profile table fetch or user metadata
  const isAdmin = user?.user_metadata?.role === "ADMIN" || user?.user_metadata?.role === "SUPER_ADMIN";
  const guestQuizId = req.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return response;
  }

  if (pathname.startsWith("/guest") || pathname.startsWith("/api/v1/guest-quiz")) {
    return response;
  }

  if (API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return response;
  }

  if (!isLoggedIn && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isLoggedIn) {
    if (pathname.startsWith("/quiz/attempt/")) {
      const id = pathname.replace("/quiz/attempt/", "").split("/")[0];
      if (id) return NextResponse.redirect(new URL(`/guest/attempt/${id}`, req.url));
    } else if (pathname.startsWith("/quiz/")) {
      const id = pathname.replace(/^\/quiz\//, "").split("/")[0];
      if (id && !id.includes("..")) {
        return NextResponse.redirect(new URL(`/guest/quiz/${id}`, req.url));
      }
    }
    if (pathname === "/past-papers" || pathname.startsWith("/past-papers/")) {
      return NextResponse.redirect(new URL("/guest/past-papers", req.url));
    }
  }

  if (!isLoggedIn && guestQuizId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Guests can only use quiz pages under /guest." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/guest/past-papers", req.url));
  }

  const isGuestBrowsable = GUEST_BROWSABLE.some((p) => pathname.startsWith(p));
  const needsAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p));

  if (!isLoggedIn) {
    if (isGuestBrowsable && !needsAuth) return response;
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/admin") && pathname.includes("_")) {
    const fixedPath = pathname.replace(/_/g, "-");
    return NextResponse.redirect(new URL(fixedPath, req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip all of `/_next/*` (chunks, CSS, HMR, RSC payloads, fonts, etc.).
     * Matching only `_next/static` let other `/_next/...` requests hit auth middleware
     * and could break styles/scripts — the UI then renders as unstyled HTML.
     */
    "/((?!_next/|favicon\\.ico|icons/|manifest\\.webmanifest|sw\\.js|workbox-|swe-worker-|fallback-).*)",
  ],
};
