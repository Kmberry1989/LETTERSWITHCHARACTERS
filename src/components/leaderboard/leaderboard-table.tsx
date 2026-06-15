'use client';

import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import { useUsers } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { normalizePlayerStats } from '@/lib/player-stats';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const leaderboardMetrics = [
  { id: 'totalScore', label: 'Total Score' },
  { id: 'highestGameScore', label: 'Best Game' },
  { id: 'highestSingleTurnScore', label: 'Best Turn' },
  { id: 'wins', label: 'Wins' },
  { id: 'totalWordsPlayed', label: 'Words Played' },
] as const;

type LeaderboardMetric = typeof leaderboardMetrics[number]['id'];

export default function LeaderboardTable() {
  const { users, loading } = useUsers();
  const [metric, setMetric] = useState<LeaderboardMetric>('totalScore');

  const activeMetric = leaderboardMetrics.find((item) => item.id === metric) || leaderboardMetrics[0];
  const leaderboardData = useMemo(
    () =>
      users
        .map((user) => {
          const stats = normalizePlayerStats(user.stats);
          return {
            uid: user.uid,
            name: user.displayName || 'Anonymous',
            value: stats[metric],
            avatarPosterUrl: user.avatarPosterUrl || null,
            photoURL: user.photoURL || null,
            subtitle: `${stats.wins}W • ${stats.gamesPlayed}G`,
          };
        })
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .map((player, index) => ({ ...player, rank: index + 1 })),
    [metric, users]
  );

  return (
    <Card className="soft-card overflow-hidden rounded-[1.5rem]">
      <CardContent className="space-y-3 p-2 sm:p-5">
        <Tabs value={metric} onValueChange={(value) => setMetric(value as LeaderboardMetric)}>
          <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-white/[.72] p-1 min-[390px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-start sm:gap-2 sm:p-2">
            {leaderboardMetrics.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="rounded-xl px-2 py-1.5 text-[0.68rem] font-black sm:text-sm">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid max-h-[calc(100svh-11rem)] gap-1.5 overflow-y-auto pr-1 md:hidden">
          {loading && Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-[1rem]" />)}
          {!loading && leaderboardData.map((player) => {
            const avatarImage = resolveAvatarImage(player);
            return (
              <div key={player.uid} className="pressed-surface flex min-w-0 items-center gap-2 rounded-[1rem] p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[.78] text-sm font-black text-slate-900 shadow-sm">#{player.rank}</div>
                <Avatar className="h-9 w-9 shrink-0 border border-white/[.78] shadow-sm">
                  {avatarImage && <AvatarImage src={avatarImage} alt={player.name} />}
                  <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-950">{player.name}</div>
                  <div className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{player.subtitle}</div>
                </div>
                <Badge className="shrink-0 rounded-full bg-emerald-600 px-2 py-1 text-[0.68rem] text-white hover:bg-emerald-600">{player.value.toLocaleString()}</Badge>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/[.72] bg-white/[.58] md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">{activeMetric.label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="h-16">
                  <TableCell className="text-center"><Skeleton className="mx-auto h-8 w-8 rounded-2xl" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-6 w-20" /></TableCell>
                </TableRow>
              ))}
              {!loading && leaderboardData.map((player) => {
                const avatarImage = resolveAvatarImage(player);
                return (
                  <TableRow key={player.uid} className="h-16 transition-colors hover:bg-white/[.68]">
                    <TableCell className="text-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[.76] text-sm font-black text-slate-600 shadow-sm">{player.rank}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="border border-white/[.78] shadow-sm">
                          {avatarImage && <AvatarImage src={avatarImage} alt={player.name} />}
                          <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-black text-slate-950">{player.name}</div>
                          <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{player.subtitle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-lg font-black text-emerald-700">{player.value.toLocaleString()}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
