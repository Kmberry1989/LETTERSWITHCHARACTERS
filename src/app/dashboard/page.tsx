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
import type { Tile } from '@/lib/game/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { ChatMessage } from '@/components/game/chat-window';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useEffect, useState } from 'react';
import { Swords, Bot } from 'lucide-react';
import { BotGameDialog } from './bot-game-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
  difficulty?: 'Easy' | 'Medium' | 'Hard';
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
            {game.difficulty && <Badge variant="outline" className="ml-2">{game.difficulty}</Badge>}
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
      if (!user) {
        setLoading(false);
      }
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

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Games</h1>

          <BotGameDialog disabled={loading} existingGames={games} />

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
                <BotGameDialog disabled={loading} existingGames={games}>Start Bot Game</BotGameDialog>
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
