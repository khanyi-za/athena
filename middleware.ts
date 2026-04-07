import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/server-config'

// Routes where a logged-in user should be redirected away to /dashboard
const AUTH_ONLY_ROUTES = ['/login', '/register']

// Route prefixes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthenticated = req.cookies.has(COOKIE_NAME)

  // Always let API routes and Next.js internals through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // Authenticated user hitting login/register → send to dashboard
  if (isAuthOnlyRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Unauthenticated user hitting a protected route → send to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
