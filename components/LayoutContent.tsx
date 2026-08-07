'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/AuthGuard';

// Dynamic import prevents the Sidebar (which uses useAuth/usePathname hooks)
// from being rendered during SSG/build — same pattern the old Navbar used.
const Sidebar = dynamic(() => import('@/components/Sidebar').then(m => ({ default: m.Sidebar })), {
  ssr: false,
});

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');
  const isLandingPage = pathname === '/';

  // Landing page — no chrome at all
  if (isLandingPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  // Auth pages — no sidebar, centered
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthGuard>{children}</AuthGuard>
      </div>
    );
  }

  // CRM pages — sidebar layout
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main
          className="transition-all duration-300 pt-14 md:pt-0"
          id="main-content"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
