'use client';

import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
}

interface Game {
  id: string;
  players: string[];
  playerData: { [uid: string]: PlayerData };
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
}


function GameCard({ game }: { game: Game }) {
  const { user } = useUser();
  const opponentUid = game.players.find(p => p !== user?.uid);
  const opponent = opponentUid ? game.playerData[opponentUid] : null;

  if (!opponent || !user) {
    return null; // Or a loading/error state
  }

  const isPlayerTurn = game.currentTurn === user.uid;
  const status = game.status === 'finished' ? 'Game Over' : isPlayerTurn ? 'Your Turn' : "Opponent's Turn";
  const opponentAvatar = PlaceHolderImages.find((p) => p.id === opponent.avatarId);

  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {opponentAvatar && (
            <AvatarImage
              src={opponentAvatar.imageUrl}
              alt={opponent.displayName}
              data-ai-hint={opponentAvatar.imageHint}
            />
          )}
          <AvatarFallback>{opponent.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>vs. {opponent.displayName}</CardTitle>
          <CardDescription>
             <Badge variant={isPlayerTurn ? 'default' : 'secondary'} className="mt-1">
                {status}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/?game=${game.id}`}>Open Game</Link>
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
  )
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: games, loading } = useCollection<Game>('games');
  
  const userGames = games.filter(game => game.players.includes(user?.uid || ''));

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Games</h1>
           <Button>New Game</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
          {!loading && userGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
           <Card className="flex flex-col items-center justify-center border-dashed text-center p-6 shadow-sm">
            <CardHeader>
              <CardTitle>Create a New Game</CardTitle>
              <CardDescription>Challenge a friend or a random opponent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Find Match</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
