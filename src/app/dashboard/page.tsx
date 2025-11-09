'use client';

import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useUser, useUsers, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createTileBag, drawTiles } from '@/lib/game-logic';
import type { Tile } from '@/components/game/game-board';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { ChatMessage } from '@/components/game/chat-window';

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
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


function GameCard({ game }: { game: Game }) {
  const { user } = useUser();
  const opponentUid = game.players.find(p => p !== user?.uid);
  const opponent = opponentUid ? game.playerData[opponentUid] : null;

  if (!opponent || !user) {
    return null; // Or a loading/error state
  }

  let statusText = '';
  if (game.status === 'finished') {
    statusText = game.winner === user.uid ? 'You Won!' : game.winner ? 'You Lost' : 'Game Over';
  } else {
    statusText = game.currentTurn === user.uid ? 'Your Turn' : "Opponent's Turn";
  }

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
             <Badge variant={game.status === 'finished' ? 'destructive' : (game.currentTurn === user.uid ? 'default' : 'secondary')} className="mt-1">
                {statusText}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/game?game=${game.id}`}>{game.status === 'finished' ? 'View Results' : 'Open Game'}</Link>
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
  const { user }- useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const gamesCollection = useMemoFirebase(() => {
    return firestore ? collection(firestore, 'games') : null;
  }, [firestore]);

  const { data: games, isLoading: gamesLoading } = useCollection<Game>(gamesCollection);
  const { users: allUsers, loading: usersLoading } = useUsers();
  
  const userGames = games ? games.filter(game => game.players.includes(user?.uid || '')) : [];
  const loading = gamesLoading || usersLoading;

  const handleNewGame = async () => {
    if (!user || !firestore || !allUsers || allUsers.length === 0) {
        toast({
            variant: "destructive",
            title: "Unable to start new game",
            description: "Not logged in or no other players available.",
        });
        return;
    }

    const otherPlayers = allUsers.filter(u => u.uid !== user.uid);
    if (otherPlayers.length === 0) {
        toast({
            variant: "destructive",
            title: "No opponents available",
            description: "There are no other players to start a game with.",
        });
        return;
    }
    const opponent = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    let tileBag = createTileBag();
    const [player1Tiles, tileBagAfterP1] = drawTiles(tileBag, 7);
    const [player2Tiles, finalTileBag] = drawTiles(tileBagAfterP1, 7);
    tileBag = finalTileBag;


    const newGame: Omit<Game, 'id'> = {
        players: [user.uid, opponent.uid],
        playerData: {
            [user.uid]: {
                displayName: user.displayName || 'You',
                score: 0,
                avatarId: 'user-1', // Placeholder avatar
                tiles: player1Tiles,
                hintUsed: false,
            },
            [opponent.uid]: {
                displayName: opponent.displayName || 'Opponent',
                score: 0,
                avatarId: 'user-2', // Placeholder avatar
                tiles: player2Tiles,
                hintUsed: false,
            }
        },
        board: {},
        tileBag: tileBag,
        currentTurn: user.uid,
        status: 'active',
        consecutivePasses: 0,
        messages: [],
    };

    const gamesCol = collection(firestore, 'games');
    
    addDoc(gamesCol, newGame).then(() => {
        toast({
            title: "Game created!",
            description: `You've started a new game against ${opponent.displayName}.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: gamesCol.path,
            operation: 'create',
            requestResourceData: newGame,
          } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
    });
  };


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Games</h1>
           <Button onClick={handleNewGame} disabled={loading}>New Game</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
          {!loading && userGames && userGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
           <Card className="flex flex-col items-center justify-center border-dashed text-center p-6 shadow-sm">
            <CardHeader className="-mt-6">
              <CardTitle>Create a New Game</CardTitle>
              <CardDescription>Challenge a friend or a random opponent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleNewGame} disabled={loading}>Find Match</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
