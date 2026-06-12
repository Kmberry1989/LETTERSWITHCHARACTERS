'use client';

import { useMemo, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import { useUsers } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { normalizePlayerStats } from '@/lib/player-stats';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const leaderboardMetrics = [
  { id: 'totalScore', label: 'Total Score' },
  { id: 'highestGameScore', label: 'Best Game' },
  { id: 'highestSingleTurnScore', label: 'Best Turn' },
  { id: 'wins', label: 'Wins' },
  { id: 'totalWordsPlayed', label: 'Words Played' },
] as const;

type LeaderboardMetric = typeof leaderboardMetrics[number]['id'];

type PlayerRow = {
  uid: string;
  name: string;
  value: number;
  avatarPosterUrl: string | null;
  photoURL: string | null;
  subtitle: string;
  rank: number;
};

function RankMedal({ rank }: { rank: number }) {
  const isTopThree = rank <= 3;
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black tabular-nums',
        isTopThree
          ? 'bg-[linear-gradient(180deg,#fff4b8,#ffc947)] text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_8px_18px_rgba(255,201,71,.24)]'
          : 'bg-slate-100 text-slate-500'
      )}
    >
      {isTopThree ? <Medal className="h-5 w-5" /> : rank}
    </span>
  );
}

function PlayerIdentity({ player }: { player: PlayerRow }) {
  const avatarImage = resolveAvatarImage(player);
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <Avatar className="h-11 w-11 ring-4 ring-white/70">
        {avatarImage && <AvatarImage src={avatarImage} alt={player.name} />}
        <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-black text-slate-950">{player.name}</div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{player.subtitle}</div>
      </div>
    </div>
  );
}

function PodiumCard({ player, label }: { player: PlayerRow; label: string }) {
  return (
    <div className="soft-card rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <PlayerIdentity player={player} />
        <RankMedal rank={player.rank} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
        <span className="score-capsule px-4 py-1.5 text-base tabular-nums">{player.value.toLocaleString()}</span>
      </div>
    </div>
  );
}

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

  const podium = leaderboardData.slice(0, 3);
  const remainingPlayers = leaderboardData.slice(3);

  return (
    <Card className="glass-panel overflow-hidden rounded-[2rem] border-white/70">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <Tabs value={metric} onValueChange={(value) => setMetric(value as LeaderboardMetric)}>
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-[1.35rem] bg-white/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.78)]">
            {leaderboardMetrics.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="rounded-[1rem] px-4 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-3 md:hidden">
          {loading && Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-[1.5rem]" />)}
          {!loading && podium.map((player) => <PodiumCard key={player.uid} player={player} label={activeMetric.label} />)}
          {!loading && remainingPlayers.length > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <Trophy className="h-4 w-4" />
                Full ranking
              </div>
              {remainingPlayers.map((player) => (
                <div key={player.uid} className="soft-card flex items-center justify-between gap-3 rounded-[1.35rem] p-3">
                  <div className="flex items-center gap-3">
                    <RankMedal rank={player.rank} />
                    <PlayerIdentity player={player} />
                  </div>
                  <span className="score-capsule px-3 py-1 text-sm tabular-nums">{player.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/62 md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24 text-center font-black text-slate-400">Rank</TableHead>
                <TableHead className="font-black text-slate-400">Player</TableHead>
                <TableHead className="text-right font-black text-slate-400">{activeMetric.label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="h-16">
                  <TableCell className="text-center">
                    <Skeleton className="mx-auto h-10 w-10 rounded-2xl" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-full" />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && leaderboardData.map((player) => (
                <TableRow key={player.uid} className="h-20 border-white/70 hover:bg-white/52">
                  <TableCell className="text-center">
                    <RankMedal rank={player.rank} />
                  </TableCell>
                  <TableCell>
                    <PlayerIdentity player={player} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="score-capsule px-4 py-1.5 text-lg tabular-nums">{player.value.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
