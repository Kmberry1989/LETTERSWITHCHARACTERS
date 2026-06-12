'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Gift, Loader2, Sparkles } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type RetentionModeId, type RetentionState } from '@/lib/retention';
import { cn } from '@/lib/utils';

type ArcadeSessionStatusProps = {
  modeId: RetentionModeId;
  sessionId: string;
  score?: number;
  completed?: boolean;
  className?: string;
};

type ArcadeSessionResponse = {
  duplicate: boolean;
  dailyRewardClaimed: boolean;
  retention: RetentionState;
  rewards: {
    session: { berries: number; experience: number };
    dailyReward: { berries: number; experience: number };
    total: { berries: number; experience: number };
  };
};

type SaveState = 'saving' | 'saved' | 'error' | 'signed-out';

export function ArcadeSessionStatus({
  modeId,
  sessionId,
  score = 0,
  completed = true,
  className,
}: ArcadeSessionStatusProps) {
  const { user, isUserLoading } = useUser();
  const [saveState, setSaveState] = useState<SaveState>(isUserLoading || user?.uid ? 'saving' : 'signed-out');
  const [result, setResult] = useState<ArcadeSessionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setErrorMessage(null);
    setSaveState(isUserLoading || user?.uid ? 'saving' : 'signed-out');
  }, [isUserLoading, sessionId, user?.uid]);

  useEffect(() => {
    if (isUserLoading || !user?.uid || !completed || saveState !== 'saving') {
      return;
    }

    let cancelled = false;

    const submit = async () => {
      try {
        const response = await fetch('/api/retention/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'arcade-session',
            sessionId,
            modeId,
            completed,
            score,
          }),
        });
        const nextResult = (await response.json().catch(() => null)) as ArcadeSessionResponse | { error?: string } | null;
        if (!response.ok) {
          throw new Error(nextResult && 'error' in nextResult ? nextResult.error || 'Could not save this clear.' : 'Could not save this clear.');
        }
        if (cancelled) return;
        setResult(nextResult as ArcadeSessionResponse);
        setSaveState('saved');
      } catch (error: any) {
        if (cancelled) return;
        setErrorMessage(error?.message || 'Could not save this clear.');
        setSaveState('error');
      }
    };

    void submit();

    return () => {
      cancelled = true;
    };
  }, [completed, isUserLoading, modeId, saveState, score, sessionId, user?.uid]);

  if (saveState === 'signed-out') {
    return (
      <div className={cn('rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 shadow-sm', className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
              <Sparkles className="h-4 w-4" />
              Clear finished
            </div>
            <p className="mt-2 text-sm text-amber-900">Sign in to save this clear, keep your streak, and collect arcade rewards.</p>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link href="/">Sign in to save</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (saveState === 'saving') {
    return (
      <div className={cn('rounded-3xl border border-sky-200 bg-sky-50/90 p-4 text-sky-950 shadow-sm', className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em]">Saving clear</div>
            <p className="mt-1 text-sm text-sky-900">Recording your rewards, streak progress, and any eligible daily reward.</p>
          </div>
        </div>
      </div>
    );
  }

  if (saveState === 'error') {
    return (
      <div className={cn('rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-rose-950 shadow-sm', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
              <AlertCircle className="h-4 w-4" />
              Save failed
            </div>
            <p className="mt-2 text-sm text-rose-900">{errorMessage || 'Could not save this clear.'}</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full border-rose-300 bg-white/80" onClick={() => setSaveState('saving')}>
            Retry save
          </Button>
        </div>
      </div>
    );
  }

  const totalRewards = result?.rewards.total || { berries: 0, experience: 0 };
  const streakCount = result?.retention.streakCount || 0;
  const duplicate = Boolean(result?.duplicate);
  const dailyRewardClaimed = Boolean(result?.dailyRewardClaimed);

  return (
    <div className={cn('rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
            <CheckCircle2 className="h-4 w-4" />
            {duplicate ? 'Clear already saved' : 'Rewards saved'}
          </div>
          <p className="mt-2 text-sm text-emerald-900">
            {duplicate
              ? 'This cleared run was already recorded, so your streak and retention progress stay intact.'
              : dailyRewardClaimed
                ? 'This clear counted immediately, and today’s daily reward auto-claimed with it.'
                : 'This clear counted immediately toward your streak and arcade progress.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!duplicate ? (
            <>
              <Badge className="rounded-full bg-white/85 text-emerald-950 hover:bg-white/85">+{totalRewards.experience} XP</Badge>
              <Badge className="rounded-full bg-white/85 text-emerald-950 hover:bg-white/85">+{totalRewards.berries} berries</Badge>
            </>
          ) : null}
          <Badge className="rounded-full bg-white/85 text-emerald-950 hover:bg-white/85">{streakCount} day streak</Badge>
          {dailyRewardClaimed ? (
            <Badge className="rounded-full bg-emerald-700 text-white hover:bg-emerald-700">
              <Gift className="mr-1 h-3.5 w-3.5" />
              Daily reward auto-claimed
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
