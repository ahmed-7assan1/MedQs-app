import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const GUEST_QUIZ_COOKIE = "medq_guest_quiz_uid";

const API_PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/v1/universities",
  "/api/v1/academic-years",
  "/api/v1/semesters",
  "/api/v1/ranks",
  "/api/v1/leaderboard",
];

/** Logged-out users may open these (no account). Quiz list uses `/guest/past-papers`. */
const GUEST_BROWSABLE = ["/landing", "/modules", "/leaderboard", "/forum", "/profile"];

const AUTH_REQUIRED = ["/profile/edit", "/notifications", "/quiz", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isLoggedIn = !!session?.user;
  const guestQuizId = req.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/guest") || pathname.startsWith("/api/v1/guest-quiz")) {
    return NextResponse.next();
  }

  if (API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!isLoggedIn && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/landing", req.url));
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
    if (isGuestBrowsable && !needsAuth) return NextResponse.next();
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const semesterId = (session!.user as { semesterId?: string | null }).semesterId;
  if (!semesterId && !isAdmin && !pathname.startsWith("/api") && pathname !== "/register") {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

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
