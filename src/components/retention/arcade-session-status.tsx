'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MODE_METADATA, type GameSessionOutcome, type RetentionModeId, type RetentionState } from '@/lib/retention';
import { cn } from '@/lib/utils';

type ArcadeSessionStatusProps = {
  modeId: RetentionModeId;
  sessionId: string;
  score?: number;
  outcome?: GameSessionOutcome;
  completed?: boolean;
  onPlayAgain?: () => void;
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
  progress?: {
    outcome: GameSessionOutcome;
    bestScore: number;
    isPersonalBest: boolean;
    questDeltas: Array<{ id: string; title: string; progress: number; goal: number; delta: number }>;
    recommendedNextHref: string;
  };
};

type SaveState = 'saving' | 'saved' | 'error' | 'signed-out';

export function ArcadeSessionStatus({
  modeId,
  sessionId,
  score = 0,
  completed = true,
  outcome = completed === false ? 'lost' : 'completed',
  onPlayAgain,
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
    if (isUserLoading || !user?.uid || outcome === 'abandoned' || saveState !== 'saving') {
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
            outcome,
            completed: completed && (outcome === 'won' || outcome === 'completed'),
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
  }, [completed, isUserLoading, modeId, outcome, saveState, score, sessionId, user?.uid]);

  const mode = MODE_METADATA[modeId];
  const outcomeTitle = outcome === 'lost' ? 'Run complete' : outcome === 'won' ? 'You did it!' : 'Story cleared!';
  const actionRow = (recommendedHref = '/minigames') => (
    <div className="mt-5 grid gap-2 sm:grid-cols-3">
      <Button type="button" onClick={onPlayAgain} disabled={!onPlayAgain} className="rounded-full"><RotateCcw className="mr-2 h-4 w-4" />Play Again</Button>
      <Button asChild variant="reward" className="rounded-full"><Link href={recommendedHref}><ArrowRight className="mr-2 h-4 w-4" />Next Game</Link></Button>
      <Button asChild variant="outline" className="rounded-full"><Link href="/minigames">Back to Arcade</Link></Button>
    </div>
  );

  const frame = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`result-${sessionId}`}>
      <div className={cn('w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl sm:p-7', className)}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Trophy className="h-6 w-6" /></span>
          <div><div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{mode.title}</div><h2 id={`result-${sessionId}`} className="font-headline text-3xl font-black text-slate-950">{outcomeTitle}</h2></div>
        </div>
        {children}
      </div>
    </div>
  );

  if (saveState === 'signed-out') {
    return frame(
      <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
              <Sparkles className="h-4 w-4" />
              {mode.scoreLabel}: {score}
            </div>
            <p className="mt-2 text-sm text-amber-900">Sign in to save future runs, build your streak, and collect rewards. This practice result was not saved.</p>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link href="/">Sign in to save</Link>
          </Button>
        </div>
        {actionRow()}
      </div>
    );
  }

  if (saveState === 'saving') {
    return frame(
      <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-4 text-sky-950 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em]">Saving clear</div>
            <p className="mt-1 text-sm text-sky-900">Saving progress.</p>
          </div>
        </div>
      </div>
    );
  }

  if (saveState === 'error') {
    return frame(
      <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-rose-950 shadow-sm">
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
        {actionRow()}
      </div>
    );
  }

  const totalRewards = result?.rewards.total || { berries: 0, experience: 0 };
  const streakCount = result?.retention.streakCount || 0;
  const duplicate = Boolean(result?.duplicate);
  const dailyRewardClaimed = Boolean(result?.dailyRewardClaimed);

  return frame(
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
            <CheckCircle2 className="h-4 w-4" />
            {duplicate ? 'Run already saved' : `${mode.scoreLabel}: ${score}`}
          </div>
          <p className="mt-2 text-sm text-emerald-900">
            {duplicate
              ? 'This cleared run was already recorded, so your streak and retention progress stay intact.'
              : dailyRewardClaimed
                ? 'Clear saved.'
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
        </div>
      </div>
      {result?.progress?.isPersonalBest ? <div className="mt-3 font-black text-amber-700">New personal best: {result.progress.bestScore}</div> : null}
      {result?.progress?.questDeltas?.length ? <div className="mt-3 text-sm font-semibold text-emerald-900">Quest progress: {result.progress.questDeltas.map((quest) => `${quest.title} ${quest.progress}/${quest.goal}`).join(' · ')}</div> : null}
      {actionRow(result?.progress?.recommendedNextHref)}
    </div>
  );
}
