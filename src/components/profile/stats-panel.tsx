'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { getWinRate, normalizePlayerStats } from '@/lib/player-stats';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-black text-foreground">{value}</div>
    </div>
  );
}

export default function StatsPanel() {
  const { user } = useUser();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  if (isLoading || !userProfile) {
    return <Skeleton className="h-[320px] w-full rounded-3xl" />;
  }

  const stats = normalizePlayerStats(userProfile.stats);
  const winRate = getWinRate(stats);

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,245,230,0.9))] shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Games Played" value={stats.gamesPlayed} />
        <StatCard label="Wins" value={stats.wins} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Total Score" value={stats.totalScore.toLocaleString()} />
        <StatCard label="Best Game" value={stats.highestGameScore.toLocaleString()} />
        <StatCard label="Best Turn" value={stats.highestSingleTurnScore.toLocaleString()} />
        <StatCard label="Words Played" value={stats.totalWordsPlayed.toLocaleString()} />
        <StatCard label="Losses" value={stats.losses} />
        <StatCard label="Ties" value={stats.ties} />
      </CardContent>
    </Card>
  );
}
