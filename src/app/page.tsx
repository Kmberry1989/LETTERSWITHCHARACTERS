'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import ChatWindow, { Message } from '@/components/game/chat-window';
import { Card, CardContent } from '@/components/ui/card';
import { useAudio } from '@/hooks/use-audio';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cat } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc } from 'firebase/firestore';
import { drawTiles } from '@/lib/game-logic';

const initialMessages: Message[] = [
    { sender: 'Alex', text: 'Hey, good luck!' },
    { sender: 'You', text: 'You too!' },
    { sender: 'Alex', text: 'Nice first move.' },
];

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
  tiles: (Tile | null)[];
}

interface Game {
  id: string;
  players: string[];
  playerData: { [uid: string]: PlayerData };
  board: { [key: string]: Tile };
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
}


function GameInstance({ game }: { game: Game }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
  const [draggedTile, setDraggedTile] = useState<{ tile: Tile; index: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { playSfx } = useAudio();

  useEffect(() => {
    if (user && game) {
      const userTiles = game.playerData[user.uid]?.tiles || [];
       // Ensure the rack has 7 slots, filling empty ones with null
      const rackTiles = Array(7).fill(null).map((_, i) => userTiles[i] || null);
      setPlayerTiles(rackTiles);
    }
  }, [game, user]);


  if (!user) return <GameLoadingSkeleton />;

  const isPlayerTurn = game.currentTurn === user.uid;
  const opponentUid = game.players.find(p => p !== user.uid) || '';
  const players = [game.playerData[user.uid], game.playerData[opponentUid]];


  const handleTileSelect = (index: number) => {
    if (playerTiles[index]) {
      if (selectedTileIndex === index) {
        setSelectedTileIndex(null);
      } else {
        setSelectedTileIndex(index);
        playSfx('click');
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedTileIndex !== null) {
      const tileToPlace = playerTiles[selectedTileIndex];
      if (tileToPlace) {
        setPendingTiles([...pendingTiles, { ...tileToPlace, row, col }]);
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[selectedTileIndex] = null;
        setPlayerTiles(newPlayerTiles);
        setSelectedTileIndex(null);
        playSfx('place');
      }
    }
  };

  const handleDragStart = (tile: Tile, index: number) => {
    setDraggedTile({ tile, index });
    if (selectedTileIndex !== null) {
      setSelectedTileIndex(null);
    }
  };

  const handleDropOnBoard = (row: number, col: number) => {
    if (draggedTile) {
      const isOccupied =
        pendingTiles.some((t) => t.row === row && t.col === col) ||
        game.board[`${row}-${col}`];

      if (!isOccupied) {
        setPendingTiles([...pendingTiles, { ...draggedTile.tile, row, col }]);
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[draggedTile.index] = null;
        setPlayerTiles(newPlayerTiles);
        playSfx('place');
      }
    }
    setDraggedTile(null);
  };

  const handleDropOnRack = (dropIndex: number) => {
    if (draggedTile === null) return;

    const newPlayerTiles = [...playerTiles];
    if (newPlayerTiles[dropIndex] === null) {
      newPlayerTiles[dropIndex] = draggedTile.tile;
      newPlayerTiles[draggedTile.index] = null;
    } else {
      const tileAtDropIndex = newPlayerTiles[dropIndex];
      newPlayerTiles[dropIndex] = draggedTile.tile;
      newPlayerTiles[draggedTile.index] = tileAtDropIndex;
    }

    setPlayerTiles(newPlayerTiles);
    setDraggedTile(null);
    playSfx('click');
  };

  const handleRecallAll = () => {
    if (pendingTiles.length === 0) return;
    const newPlayerTiles = [...playerTiles];
    pendingTiles.forEach((pendingTile) => {
      const emptyIndex = newPlayerTiles.findIndex((t) => t === null);
      if (emptyIndex !== -1) {
        newPlayerTiles[emptyIndex] = { letter: pendingTile.letter, score: pendingTile.score };
      }
    });
    setPlayerTiles(newPlayerTiles);
    setPendingTiles([]);
    playSfx('swoosh');
  };

  const handleRecallTile = (tileToRecall: PlacedTile) => {
    const newPlayerTiles = [...playerTiles];
    const emptyIndex = newPlayerTiles.findIndex((t) => t === null);
    if (emptyIndex !== -1) {
      newPlayerTiles[emptyIndex] = { letter: tileToRecall.letter, score: tileToRecall.score };
    }
    const newPendingTiles = pendingTiles.filter(
      (pt) => !(pt.row === tileToRecall.row && pt.col === tileToRecall.col)
    );
    setPlayerTiles(newPlayerTiles);
    setPendingTiles(newPendingTiles);
    playSfx('swoosh');
  };

  const handleShuffle = () => {
    const shuffledTiles = [...playerTiles].filter((t) => t !== null) as Tile[];
    for (let i = shuffledTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
    }
    const newPlayerTiles = [...playerTiles];
    let tileIndex = 0;
    for (let i = 0; i < newPlayerTiles.length; i++) {
      if (newPlayerTiles[i] !== null) {
        newPlayerTiles[i] = shuffledTiles[tileIndex++];
      }
    }
    setPlayerTiles(newPlayerTiles);
    playSfx('swoosh');
  };
  
  const handleSendMessage = (text: string) => {
    setMessages([...messages, { sender: 'You', text }]);
  };
  
  const handlePlayWord = async () => {
    if (pendingTiles.length === 0 || !isPlayerTurn || !firestore) return;
  
    // 1. Prepare updates
    const newBoard = { ...game.board };
    pendingTiles.forEach(tile => {
      newBoard[`${tile.row}-${tile.col}`] = { letter: tile.letter, score: tile.score };
    });
  
    const tilesToDraw = pendingTiles.length;
    const remainingPlayerTiles = playerTiles.filter(t => t !== null) as Tile[];
  
    const [newTiles, updatedTileBag] = drawTiles(game.tileBag, tilesToDraw);
  
    const updatedPlayerTiles = [...remainingPlayerTiles, ...newTiles];
  
    // 2. Construct the update payload
    const gameDocRef = doc(firestore, 'games', game.id);
    const updatePayload = {
      board: newBoard,
      tileBag: updatedTileBag,
      [`playerData.${user.uid}.tiles`]: updatedPlayerTiles,
      // TODO: Add score calculation
      currentTurn: opponentUid, // Switch turn
    };
  
    // 3. Update Firestore
    try {
      await updateDoc(gameDocRef, updatePayload);
      setPendingTiles([]); // Clear pending tiles on successful play
      playSfx('place');
    } catch (error) {
      console.error("Error playing word:", error);
      // Optional: show an error toast to the user
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full p-4 sm:p-8 pt-24 sm:pt-24">
       <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg px-4">
        <Scoreboard players={players} isPlayerTurn={isPlayerTurn} currentPlayerName={user.displayName || 'Player'} />
      </div>

      <div className="flex-grow">
        <Card className="h-full shadow-sm">
          <CardContent className="p-2 sm:p-4 h-full flex items-center justify-center">
            <GameBoard
              placedTiles={game.board}
              pendingTiles={pendingTiles}
              onCellClick={handleCellClick}
              onDrop={handleDropOnBoard}
              onRecallTile={handleRecallTile}
            />
          </CardContent>
        </Card>
      </div>
      <div className="relative">
        <TileRack
          tiles={playerTiles}
          selectedTileIndex={selectedTileIndex}
          onTileSelect={handleTileSelect}
          onRecall={handleRecallAll}
          onShuffle={handleShuffle}
          onDragStart={handleDragStart}
          onDrop={handleDropOnRack}
          onChatClick={() => setIsChatOpen(true)}
          onPlay={handlePlayWord}
          isPlayerTurn={isPlayerTurn}
        />
        <ChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={messages}
            onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

function GameLoadingSkeleton() {
    return (
        <div className="flex flex-col gap-4 h-full p-4 sm:p-8 pt-24 sm:pt-24 animate-pulse">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg px-4">
                <Card><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
            </div>
            <div className="flex-grow">
                <Card className="h-full shadow-sm">
                <CardContent className="p-2 sm:p-4 h-full flex items-center justify-center">
                   <Skeleton className="w-full aspect-square max-w-full" />
                </CardContent>
                </Card>
            </div>
             <div className="relative">
                 <Card><CardContent className="p-4"><Skeleton className="h-28" /></CardContent></Card>
            </div>
        </div>
    )
}

function NoGameSelected() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Cat className="w-24 h-24 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Game Selected</h2>
            <p className="mt-2 text-muted-foreground">Please select a game from your dashboard to begin.</p>
            <Button asChild className="mt-6">
                <Link href="/dashboard">
                    Go to Dashboard
                </Link>
            </Button>
        </div>
    );
}

function GamePageContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');

  if (!gameId) {
    return <NoGameSelected />;
  }

  const { data: game, loading, error } = useDoc<Game>(`games/${gameId}`);

  if (loading) {
    return <GameLoadingSkeleton />;
  }

  if (error || !game) {
    return <div>Error loading game or game not found.</div>;
  }
  
  return <GameInstance game={game} />;
}


export default function GamePage() {
  return (
    <main className="min-h-screen bg-background relative">
       <div className="absolute top-4 left-4 z-20">
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="w-full h-screen">
            <Suspense fallback={<GameLoadingSkeleton />}>
                <GamePageContent />
            </Suspense>
        </div>
    </main>
  );
}
