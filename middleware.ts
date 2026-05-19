import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // SUPER_ADMIN BYPASS: Always allow access for super admins
  const userRole = user?.user_metadata?.role
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || user?.email === 'ahmedhassan0business@gmail.com'

  if (isSuperAdmin) {
    // If super admin is on auth pages, they can stay or go to dashboard, no forced redirects
    return response
  }

  // 1. If logged in, don't allow auth pages (except onboarding)
  if (user && (pathname === '/login' || pathname === '/register' || (pathname === '/auth' && request.nextUrl.searchParams.get('mode') !== 'onboarding'))) {
    return NextResponse.redirect(new URL('/dashboard-app', request.url))
  }

  // 2. If trying to access dashboard, ensure logged in
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/dashboard-app'))) {
    return NextResponse.redirect(new URL('/auth?mode=login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
