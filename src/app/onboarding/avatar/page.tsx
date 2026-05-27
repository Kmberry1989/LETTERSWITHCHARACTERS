'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AvatarSelectionPanel from '@/components/profile/avatar-selection-panel';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { getPostLoginRoute } from '@/lib/auth-flow';

export default function AvatarOnboardingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
      return;
    }

    if (!isUserLoading && user?.onboardingCompletedAt) {
      router.replace(getPostLoginRoute(user));
    }
  }, [isUserLoading, router, user]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Card className="border-white/10 bg-slate-950/70 text-slate-50 shadow-2xl backdrop-blur">
          <CardContent className="p-6 sm:p-10">
            <AvatarSelectionPanel
              title="Complete your player setup"
              description="You’re signed in. Pick your 3D character before entering the lobby or starting a game."
              ctaLabel="Enter the game"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
