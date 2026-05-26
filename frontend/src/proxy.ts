import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  const isProtectedPage =
    pathname === '/' ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/admin');

  // If trying to access a protected page without a token, redirect to /login
  if (isProtectedPage && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // If trying to access auth pages with a token, redirect to dashboard /
  if (isAuthPage && token) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web app manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
