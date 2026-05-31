
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
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,238,0.92))] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-6 p-6">
        <Tabs value={metric} onValueChange={(value) => setMetric(value as LeaderboardMetric)}>
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-white/75 p-2">
            {leaderboardMetrics.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">{activeMetric.label}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="h-16">
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                       <Skeleton className="h-6 w-20 ml-auto" />
                  </TableCell>
              </TableRow>
            ))}
            {!loading && leaderboardData.map((player) => {
              const avatarImage = resolveAvatarImage(player);
              return (
                <TableRow key={player.uid} className="h-16">
                  <TableCell className="text-center text-lg font-bold text-muted-foreground">{player.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        {avatarImage && <AvatarImage src={avatarImage} alt={player.name} />}
                        <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{player.subtitle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold text-primary">{player.value.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
