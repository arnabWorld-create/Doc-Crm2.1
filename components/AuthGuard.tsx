'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public pages that don't require authentication
  const publicPaths = ['/auth/', '/'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));

  // FIX: useEffect must be called unconditionally (Rules of Hooks).
  // The redirect only fires when we're on a protected path AND not authenticated.
  useEffect(() => {
    if (!isPublicPath && !loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isPublicPath, loading, isAuthenticated, router]);

  // Public pages — always render immediately
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show loading state while checking auth OR if not authenticated
  // This prevents flash of content before redirect
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show content
  return <>{children}</>;
}
