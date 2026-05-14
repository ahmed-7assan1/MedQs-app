import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const isAdmin = user?.user_metadata?.role === "ADMIN" || user?.user_metadata?.role === "SUPER_ADMIN";
  const guestQuizId = request.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();

  // 1. Core Authentication Redirection (Breaks Loops)
  if (isLoggedIn && (pathname === "/login" || pathname === "/register" || (pathname === "/auth" && request.nextUrl.searchParams.get("mode") !== "onboarding"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isLoggedIn && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/auth?mode=login", request.url));
  }

  // 2. Legacy / Admin / Guest Logic
  if (pathname.startsWith("/guest") || pathname.startsWith("/api/v1/guest-quiz")) {
    return response;
  }

  if (API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return response;
  }

  if (!isLoggedIn) {
    if (pathname.startsWith("/quiz/attempt/")) {
      const id = pathname.replace("/quiz/attempt/", "").split("/")[0];
      if (id) return NextResponse.redirect(new URL(`/guest/attempt/${id}`, request.url));
    } else if (pathname.startsWith("/quiz/")) {
      const id = pathname.replace(/^\/quiz\//, "").split("/")[0];
      if (id && !id.includes("..")) return NextResponse.redirect(new URL(`/guest/quiz/${id}`, request.url));
    }
    if (pathname === "/past-papers" || pathname.startsWith("/past-papers/")) {
      return NextResponse.redirect(new URL("/guest/past-papers", request.url));
    }
  }

  const isGuestBrowsable = GUEST_BROWSABLE.some((p) => pathname.startsWith(p));
  const needsAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p));

  if (!isLoggedIn) {
    if (isGuestBrowsable && !needsAuth) return response;
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/auth?mode=login", request.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/|favicon\\.ico|icons/|manifest\\.webmanifest|sw\\.js|workbox-|swe-worker-|fallback-).*)",
  ],
};
