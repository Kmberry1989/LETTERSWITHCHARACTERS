'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export function usePlayableGate() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace('/');
    }
  }, [isUserLoading, router, user]);

  return {
    user,
    isUserLoading,
    canPlay: Boolean(user),
  };
}
