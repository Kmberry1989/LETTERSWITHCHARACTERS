'use client';

import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { addDoc, collection, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createTileBag, drawTiles } from '@/lib/game-logic';
import type { Tile } from '@/components/game/game-board';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { ChatMessage } from '@/components/game/chat-window';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
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

  const opponentAvatarImage = opponent.photoURL || PlaceHolderImages.find((p) => p.id === opponent.avatarId)?.imageUrl;


  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {opponentAvatarImage && (
            <AvatarImage
              src={opponentAvatarImage}
              alt={opponent.displayName}
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

function useUserGames() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    const userDocRef = useMemoFirebase(() => {
        return firestore && user ? doc(firestore, 'users', user.uid) : null;
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userDocRef);
    
    useEffect(() => {
        if (!userProfile || !firestore) {
             if(!user) setLoading(false);
             return;
        };

        const gameIds = userProfile.gameIds || [];
        if (gameIds.length === 0) {
            setGames([]);
            setLoading(false);
            return;
        }

        const fetchGames = async () => {
            setLoading(true);
            const gamePromises = gameIds.map(id => getDoc(doc(firestore, 'games', id)));
            const gameSnapshots = await Promise.all(gamePromises);
            const fetchedGames = gameSnapshots
                .filter(snap => snap.exists())
                .map(snap => ({ id: snap.id, ...snap.data() } as Game));
            
            setGames(fetchedGames);
            setLoading(false);
        };

        fetchGames();

    }, [userProfile, firestore, user]);

    return { games, loading };
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { games, loading: gamesLoading } = useUserGames();
  
  const loading = gamesLoading || !user;

  const handleNewBotGame = async () => {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Unable to start new game",
            description: "You must be logged in to start a new game.",
        });
        return;
    }

    const opponent = {
      uid: 'bitty-botty-001',
      displayName: 'Bitty Botty',
      avatarId: 'avatar-base',
    };
    
    // Check for existing game with bot
    const hasBotGame = games.some(game => game.players.includes(opponent.uid) && game.status === 'active');
    if (hasBotGame) {
      toast({
        variant: "destructive",
        title: "Bot Game Limit Reached",
        description: "You can only have one active game against Bitty Botty at a time.",
      });
      return;
    }


    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userProfile = userDocSnap.data() as UserProfile | undefined;

    if (!userProfile) {
        toast({
            variant: "destructive",
            title: "Could not start game",
            description: "Your user profile could not be found.",
        });
        return;
    }


    let tileBag = createTileBag();
    const [player1Tiles, tileBagAfterP1] = drawTiles(tileBag, 7);
    const [player2Tiles, finalTileBag] = drawTiles(tileBagAfterP1, 7);
    tileBag = finalTileBag;


    const newGame: Omit<Game, 'id'> = {
        players: [user.uid, opponent.uid],
        playerData: {
            [user.uid]: {
                displayName: userProfile.displayName || 'You',
                score: 0,
                avatarId: userProfile.avatarId || 'user-1',
                photoURL: userProfile.photoURL || null,
                tiles: player1Tiles,
                hintUsed: false,
            },
            [opponent.uid]: {
                displayName: opponent.displayName,
                score: 0,
                avatarId: opponent.avatarId,
                photoURL: PlaceHolderImages.find(p => p.id === opponent.avatarId)?.imageUrl,
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

    try {
        const gamesCol = collection(firestore, 'games');
        const gameDocRef = await addDoc(gamesCol, newGame);
        
        // Now update the user's profile with the new game ID
        await updateDoc(userDocRef, {
            gameIds: arrayUnion(gameDocRef.id)
        });

        toast({
            title: "Game created!",
            description: `You've started a new game against ${opponent.displayName}.`,
        });

    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: 'games or users',
            operation: 'create',
            requestResourceData: newGame,
          } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
    }
  };


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Games</h1>
           <Button onClick={handleNewBotGame} disabled={loading}>Play vs. Bot</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
          {!loading && games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
          {!loading && games.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center border-dashed text-center p-6 shadow-sm">
                <CardHeader>
                    <CardTitle>No Games Yet!</CardTitle>
                    <CardDescription>Start a new game against the bot or find a match in the lobby.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={handleNewBotGame} disabled={loading}>Start Bot Game</Button>
                </CardContent>
              </Card>
          )}
           <Card className="flex flex-col items-center justify-center border-dashed text-center p-6 shadow-sm">
            <CardHeader className="-mt-6">
              <CardTitle>Find a Match</CardTitle>
              <CardDescription>Challenge a friend or a random opponent in the lobby.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                  <Link href="/lobby">
                    <Swords className="mr-2 h-4 w-4" /> Go to Lobby
                  </Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
