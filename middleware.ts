import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that don't require authentication
const publicPaths = ['/auth/login', '/auth/register', '/'];

// CRM paths that require a valid JWT (server-side check)
const protectedPathPrefixes = [
  '/patients',
  '/appointments',
  '/calendar',
  '/analytics',
  '/payments',
  '/settings',
];

function isProtectedPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return false;
  if (pathname.startsWith('/auth/')) return false; // auth/* is login/register
  return protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow landing page and its assets
  if (pathname.startsWith('/landing')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // Protect CRM paths: require valid JWT in cookie
  if (isProtectedPath(pathname)) {
    const token = request.cookies.get('auth-token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const encoder = new TextEncoder();
      await jwtVerify(token, encoder.encode(secret));
      return NextResponse.next();
    } catch {
      // Invalid or expired token: clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
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
     * - public folder
     * - landing (landing page static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|landing).*)',
  ],
};
