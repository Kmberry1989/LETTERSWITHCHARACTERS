'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const publicPaths = ['/login'];

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublicPath = publicPaths.includes(pathname);

    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && isPublicPath) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return null; // Or a loading spinner
  }
  
  // Prevent rendering children on public paths until redirection logic is complete
  if (!user && !publicPaths.includes(pathname)) {
    return null;
  }
  if (user && publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
