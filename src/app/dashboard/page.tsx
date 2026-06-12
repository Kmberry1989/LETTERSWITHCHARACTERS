'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from '@/lib/client/document-client';
import type { Tile } from '@/lib/game/types';
import { ChatMessage } from '@/components/game/chat-window';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import { usePlayableGate } from '@/hooks/use-playable-gate';
import { useTurnNotifications } from '@/hooks/use-turn-notifications';
import { DashboardTaskbar } from '@/components/dashboard/dashboard-taskbar';
import { Sparkles, Swords } from 'lucide-react';

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
  avatarPresetId?: string | null;
  avatarPosterUrl?: string | null;
  tiles: (Tile | null)[];
  hintUsed: boolean;
}

interface Game {
  id: string;
  players: string[];
  playerData: { [uid: string]: PlayerData };
  board: { [key: string]: Tile };
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
  winner?: string;
  messages: ChatMessage[];
}

function GameStatusBadge({ game, currentUserId }: { game: Game; currentUserId: string }) {
  if (game.status === 'finished') {
    return (
      <Badge variant="outline" className="rounded-full">
        {game.winner === currentUserId ? 'Won' : game.winner ? 'Finished' : 'Draw'}
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full" variant={game.currentTurn === currentUserId ? 'default' : 'secondary'}>
      {game.currentTurn === currentUserId ? 'Your Turn' : 'Waiting'}
    </Badge>
  );
}

function FeaturedGameCard({ game }: { game: Game }) {
  const { user } = useUser();
  const opponentUid = game.players.find((playerId) => playerId !== user?.uid);
  const opponent = opponentUid ? game.playerData[opponentUid] : null;

  if (!opponent || !user) return null;

  const opponentAvatarImage = resolveAvatarImage(opponent);
  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {opponentAvatarImage && <AvatarImage src={opponentAvatarImage} alt={opponent.displayName} />}
            <AvatarFallback>{opponent.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Live Game</div>
            <CardTitle className="mt-1 text-3xl font-headline">vs. {opponent.displayName}</CardTitle>
            <CardDescription className="mt-2">
              {game.currentTurn === user.uid ? 'Your move is ready.' : `${opponent.displayName} has the board right now.`}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GameStatusBadge game={game} currentUserId={user.uid} />
          <Badge variant="outline" className="rounded-full px-3 py-1">
            You {game.playerData[user.uid]?.score || 0} - {opponent.score} {opponent.displayName}
          </Badge>
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href={`/game?game=${game.id}`}>{game.status === 'finished' ? 'View Results' : 'Open Game'}</Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

function GameCard({ game }: { game: Game }) {
  const { user } = useUser();
  const opponentUid = game.players.find((p) => p !== user?.uid);
  const opponent = opponentUid ? game.playerData[opponentUid] : null;

  if (!opponent || !user) return null;

  const opponentAvatarImage = resolveAvatarImage(opponent);
  return (
    <Card className="flex flex-col border-white/70 bg-white/92 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {opponentAvatarImage && <AvatarImage src={opponentAvatarImage} alt={opponent.displayName} />}
          <AvatarFallback>{opponent.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-xl">vs. {opponent.displayName}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <GameStatusBadge game={game} currentUserId={user.uid} />
            <Badge variant="outline" className="rounded-full">
              {game.playerData[user.uid]?.score || 0}-{opponent.score}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href={`/game?game=${game.id}`}>{game.status === 'finished' ? 'Review' : 'Open'}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function GameCardSkeleton() {
  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function useUserGames() {
  const { user } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const userDocRef = useMemoFirebase(() => {
    return user ? doc(null, 'users', user.uid) : null;
  }, [user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!userProfile) {
      if (!user) setLoading(false);
      return;
    }

    const gameIds = userProfile.gameIds || [];
    if (gameIds.length === 0) {
      setGames([]);
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      if (games.length === 0) {
        setLoading(true);
      }
      const gamePromises = gameIds.map((id) => getDoc(doc(null, 'games', id)));
      const gameSnapshots = await Promise.all(gamePromises);
      const fetchedGames = gameSnapshots
        .filter((snap) => snap.exists())
        .map((snap) => ({ id: snap.id, ...snap.data() } as Game));

      setGames(fetchedGames);
      setLoading(false);
    };

    void fetchGames();
  }, [games.length, userProfile, user]);

  return { games, loading };
}

export default function DashboardPage() {
  const { user, isUserLoading, canPlay } = usePlayableGate();
  const { games, loading: gamesLoading } = useUserGames();
  const loading = isUserLoading || gamesLoading || !user || !canPlay;

  const sortedGames = useMemo(() => {
    if (!user) return games;
    return [...games].sort((left, right) => {
      const leftRank =
        left.status === 'active' && left.currentTurn === user.uid ? 0 : left.status === 'active' ? 1 : left.status === 'pending' ? 2 : 3;
      const rightRank =
        right.status === 'active' && right.currentTurn === user.uid ? 0 : right.status === 'active' ? 1 : right.status === 'pending' ? 2 : 3;
      return leftRank - rightRank;
    });
  }, [games, user]);

  const featuredGame = sortedGames[0] || null;
  const remainingGames = featuredGame ? sortedGames.slice(1) : [];
  const usersTurnGame = user
    ? sortedGames.find((game) => game.status === 'active' && game.currentTurn === user.uid)
    : null;
  const opponentSummaries = useMemo(
    () =>
      (user ? sortedGames : []).map((game) => {
        const opponentUid = game.players.find((playerId) => playerId !== user?.uid) || '';
        const opponent = game.playerData[opponentUid];
        return {
          uid: opponentUid,
          displayName: opponent?.displayName || 'Player',
          photoURL: opponent?.photoURL || null,
          avatarPosterUrl: opponent?.avatarPosterUrl || null,
        };
      }),
    [sortedGames, user]
  );

  useTurnNotifications({
    enabled: Boolean(user && !loading),
    isUsersTurn: Boolean(usersTurnGame),
    title: 'Your turn is ready',
    body: usersTurnGame ? `A game is waiting for your move.` : 'One of your games is ready for your move.',
  });

  return (
    <AppLayout>
      <div className="flex-1 space-y-5 p-4 sm:p-8">
        {!loading ? (
          <DashboardTaskbar
            hasUsersTurn={Boolean(usersTurnGame)}
            nextTurnHref={usersTurnGame ? `/game?game=${usersTurnGame.id}` : undefined}
            opponents={opponentSummaries}
          />
        ) : (
          <Skeleton className="h-28 rounded-[2rem]" />
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Play</h1>
                <p className="mt-1 text-sm text-slate-500">Move straight into your live game, then pick up anything else below.</p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/minigames">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Arcade
                  </Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/lobby">
                    <Swords className="mr-2 h-4 w-4" />
                    Find Match
                  </Link>
                </Button>
              </div>
            </div>

            {loading && <Skeleton className="h-44 rounded-[2rem]" />}
            {!loading && featuredGame ? <FeaturedGameCard game={featuredGame} /> : null}
            {!loading && !featuredGame ? (
              <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center shadow-sm">
                <CardHeader>
                  <CardTitle>No Games Yet</CardTitle>
                  <CardDescription>Start with a match or jump into the arcade while you wait for your first duel.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-3">
                  <Button asChild className="rounded-full">
                    <Link href="/lobby">Find Match</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/minigames">Open Arcade</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">More Games</h2>
                {!loading && remainingGames.length > 0 ? (
                  <Badge variant="outline" className="rounded-full">
                    {remainingGames.length}
                  </Badge>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading && Array.from({ length: 3 }).map((_, index) => <GameCardSkeleton key={index} />)}
                {!loading && remainingGames.map((game) => <GameCard key={game.id} game={game} />)}
                {!loading && featuredGame && remainingGames.length === 0 ? (
                  <Card className="border-dashed p-6 text-sm text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                    No other games right now.
                  </Card>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/92 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Lower-friction routes when you are not in a live turn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full rounded-full">
                  <Link href="/lobby">
                    <Swords className="mr-2 h-4 w-4" />
                    Find Match
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href="/minigames">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Arcade
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
