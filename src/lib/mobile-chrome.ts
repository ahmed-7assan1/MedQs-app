/**
 * Shared mobile navigation + chrome insets for student shell.
 */

export const MOBILE_HEADER_HEIGHT_REM = 3.5; /* h-14 */
export const MOBILE_TABBAR_RESERVE_REM = 5.85;

export const MOBILE_SWIPE_ROUTES = [
  "/dashboard-app",
  "/modules",
  "/taskat",
  "/past-papers",
  "/ai-chat",
] as const;

export function matchMobileSwipeRoute(pathname: string, route: string): boolean {
  if (route === "/dashboard-app") {
    return pathname === route || pathname === "/dashboard";
  }
  return pathname.startsWith(route);
}

export function mobileSwipeRouteIndex(pathname: string): number {
  return MOBILE_SWIPE_ROUTES.findIndex((route) => matchMobileSwipeRoute(pathname, route));
}

/** Routes where bottom tab bar is hidden (full-width chrome). */
export function isImmersiveMobileRoute(pathname: string): boolean {
  const p = pathname ?? "";
  return (
    p.startsWith("/ai-chat") ||
    p.startsWith("/quiz") ||
    p.startsWith("/past-papers") ||
    p.startsWith("/guest/quiz") ||
    p.startsWith("/guest/past-papers") ||
    p.startsWith("/drawmed")
  );
}
