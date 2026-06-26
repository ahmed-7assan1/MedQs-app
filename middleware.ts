import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/auth', '/splash']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // SUPER_ADMIN BYPASS
  const userRole = user?.user_metadata?.role
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''
  const isSuperAdmin =
    userRole === 'SUPER_ADMIN' ||
    user?.email === superAdminEmail

  if (isSuperAdmin) return response

  // Save last visited page for logged-in users (skip public paths & API routes)
  if (
    user &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !PUBLIC_PATHS.includes(pathname)
  ) {
    response.cookies.set('last_page', pathname, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
  }

  // Logged-in users: redirect from public pages to last page or dashboard
  if (
    user &&
    PUBLIC_PATHS.includes(pathname)
  ) {
    const lastPage = request.cookies.get('last_page')?.value || '/dashboard-app'
    return NextResponse.redirect(new URL(lastPage, request.url))
  }

  // Complete-profile: allow only if onboarding not done yet
  if (pathname === '/complete-profile') {
    if (!user) return NextResponse.redirect(new URL('/auth?mode=login', request.url))
    if (user.user_metadata?.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard-app', request.url))
    }
    return response
  }

  // Unauthenticated users cannot access dashboard
  if (
    !user &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/dashboard-app'))
  ) {
    return NextResponse.redirect(new URL('/auth?mode=login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
