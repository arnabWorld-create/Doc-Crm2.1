import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow landing page and its assets
  if (pathname.startsWith('/landing')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow all other routes for now
  // Auth is handled by the AuthProvider and useAuth hook
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
