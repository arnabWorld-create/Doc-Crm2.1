'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/AuthGuard';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    // Landing page - no navbar, no container
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    );
  }

  // CRM pages - with navbar and container
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <AuthGuard>
          {children}
        </AuthGuard>
      </main>
    </>
  );
}
