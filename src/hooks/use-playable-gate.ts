'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { hasCompletedAvatarOnboarding } from '@/lib/avatar-catalog';

export function usePlayableGate() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    if (!hasCompletedAvatarOnboarding(user)) {
      router.replace('/onboarding/avatar');
    }
  }, [isUserLoading, router, user]);

  return {
    user,
    isUserLoading,
    canPlay: Boolean(user && hasCompletedAvatarOnboarding(user)),
  };
}
