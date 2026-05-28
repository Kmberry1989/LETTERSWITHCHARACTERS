'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function AvatarOnboardingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
      return;
    }

    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [isUserLoading, router, user]);

  return null;
}
