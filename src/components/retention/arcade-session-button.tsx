'use client';

import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import {
  getDailyChallenge,
  hasCompletedDailyChallenge,
  normalizeRetentionState,
  type RetentionModeId,
} from '@/lib/retention';

type ArcadeSessionButtonProps = {
  modeId: RetentionModeId;
  completed?: boolean;
  score?: number;
  label?: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
};

export function ArcadeSessionButton({
  modeId,
  completed = true,
  score = 0,
  label = 'Record Session',
  className,
  variant = 'default',
  size = 'default',
}: ArcadeSessionButtonProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const shouldCompleteDailyChallenge = useMemo(() => {
    const retention = normalizeRetentionState(userProfile?.retention);
    return getDailyChallenge().modeId === modeId && !hasCompletedDailyChallenge(retention);
  }, [modeId, userProfile?.retention]);

  const onClick = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/retention/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'arcade-session',
          modeId,
          completed,
          score,
          completeDailyChallenge: shouldCompleteDailyChallenge,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not record session.');
      }

      const challengeCopy = shouldCompleteDailyChallenge ? ' Daily challenge cleared.' : '';
      toast({
        title: 'Progress saved',
        description: `+${result?.rewards?.experience || 0} XP and +${result?.rewards?.berries || 0} berries.${challengeCopy}`,
      });
    } catch (error: any) {
      toast({
        title: 'Progress failed',
        description: error?.message || 'Could not record this session.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={!user || submitting} className={className} variant={variant} size={size}>
      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      {submitting ? 'Saving...' : label}
    </Button>
  );
}
