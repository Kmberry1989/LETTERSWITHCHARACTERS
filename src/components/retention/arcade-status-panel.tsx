'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarRange, Gift, Sparkles, Swords, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import {
  MODE_METADATA,
  getNextActionHref,
  getRetentionSummary,
  getUpcomingWeeklyWindow,
  normalizeRetentionState,
} from '@/lib/retention';

type ArcadeStatusPanelProps = {
  hasUsersTurn?: boolean;
  nextTurnHref?: string;
};

export function ArcadeStatusPanel({ hasUsersTurn = false, nextTurnHref }: ArcadeStatusPanelProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  const retention = useMemo(() => normalizeRetentionState(userProfile?.retention), [userProfile?.retention]);
  const summary = useMemo(() => getRetentionSummary(retention), [retention]);
  const weeklyWindow = getUpcomingWeeklyWindow();
  const nextActionHref = hasUsersTurn ? nextTurnHref || '/dashboard' : getNextActionHref(retention, false);
  const nextActionLabel = hasUsersTurn
    ? 'Take your turn'
    : summary.dailyChallengeCompleted
      ? 'Browse the arcade'
      : `Play ${MODE_METADATA[summary.dailyChallenge.modeId].title}`;

  const claimDailyReward = async () => {
    setClaiming(true);
    try {
      const response = await fetch('/api/retention/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim-daily-reward' }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not claim daily reward.');
      }
      if (!result?.claimed) {
        toast({
          title: 'Reward locked',
          description: 'Complete a challenge or arcade session first.',
        });
        return;
      }
      toast({
        title: 'Daily reward claimed',
        description: `+${result.rewards.experience} XP and +${result.rewards.berries} berries added.`,
      });
    } catch (error: any) {
      toast({
        title: 'Claim failed',
        description: error?.message || 'Could not claim your reward right now.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (isLoading || !userProfile) {
    return <Skeleton className="h-[420px] w-full rounded-[28px]" />;
  }

  const questPercent = summary.totalQuestGoal > 0 ? Math.round((summary.totalQuestProgress / summary.totalQuestGoal) * 100) : 0;
  const dailyMode = MODE_METADATA[summary.dailyChallenge.modeId];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,247,237,0.98),rgba(255,255,255,0.96),rgba(240,249,255,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.09)]">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-slate-950 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white hover:bg-slate-950">
              Next Best Action
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {summary.weeklyActivityCount}/7 active days this week
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {retention.streakCount} day streak
            </Badge>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <CardTitle className="text-3xl font-headline">Arcade rhythm, not dead time</CardTitle>
              <CardDescription className="mt-2 text-base text-slate-600">
                {hasUsersTurn
                  ? 'A live word duel is waiting, and your daily arcade goals are still visible underneath it.'
                  : summary.dailyChallengeCompleted
                    ? 'Your featured challenge is done. Use the arcade to keep your streak and quest board moving.'
                    : `${summary.dailyChallenge.title} is live in ${dailyMode.title}. ${summary.dailyChallenge.description}`}
              </CardDescription>
            </div>
            <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-orange-200/60">
              <Link href={nextActionHref}>
                {hasUsersTurn ? <Swords className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {nextActionLabel}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${dailyMode.accent} p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-600">Daily Challenge</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{summary.dailyChallenge.title}</div>
                <p className="mt-2 text-sm text-slate-700">{summary.dailyChallenge.targetLabel}</p>
              </div>
              <Badge className="rounded-full bg-white/80 text-slate-900 hover:bg-white/80">
                {summary.dailyChallengeCompleted ? 'Completed' : 'Open today'}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4" />
              +{summary.dailyChallenge.rewardExperience} XP / +{summary.dailyChallenge.rewardBerries} berries
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="rounded-full bg-white/85 text-slate-950 hover:bg-white">
                <Link href={dailyMode.href}>Play {dailyMode.title}</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/80 bg-white/45"
                onClick={claimDailyReward}
                disabled={claiming || summary.rewardClaimedToday}
              >
                <Gift className="mr-2 h-4 w-4" />
                {summary.rewardClaimedToday ? 'Reward claimed' : claiming ? 'Claiming...' : 'Claim daily reward'}
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Quest Board</div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {summary.completedQuests} / {summary.quests.length} complete
                </div>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <CalendarRange className="mr-2 h-3.5 w-3.5" />
                {weeklyWindow.from} - {weeklyWindow.to}
              </Badge>
            </div>

            <div className="mt-4">
              <Progress value={questPercent} className="h-3 rounded-full bg-slate-200" />
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {summary.totalQuestProgress} of {summary.totalQuestGoal} quest actions banked
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {summary.quests.map((quest) => {
                const done = quest.progress >= quest.goal;
                return (
                  <div key={quest.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-900">{quest.title}</div>
                        <div className="text-sm text-slate-600">{quest.description}</div>
                      </div>
                      <Badge variant={done ? 'default' : 'secondary'} className="rounded-full">
                        {quest.progress}/{quest.goal}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Mode Pulse</CardTitle>
          <CardDescription>Permanent arcade lanes that all feed one shared account loop.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(MODE_METADATA).map(([modeId, mode]) => {
            const progress = retention.modeProgress[modeId as keyof typeof retention.modeProgress];
            return (
              <Link
                key={modeId}
                href={mode.href}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 transition-transform hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div>
                  <div className="font-black text-slate-900">{mode.title}</div>
                  <div className="text-sm text-slate-600">{progress.sessionsPlayed} sessions logged</div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div className="font-semibold text-slate-700">Best score {progress.bestScore}</div>
                  <div className="flex items-center justify-end gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {progress.dailyChallengesCompleted} dailies
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
