'use client';

import { useState } from 'react';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import ChatWindow, { Message } from '@/components/game/chat-window';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAudio } from '@/hooks/use-audio';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const initialPlayerTiles: (Tile | null)[] = [
  { letter: 'A', score: 1 },
  { letter: 'C', score: 3 },
  { letter: 'T', score: 1 },
  { letter: 'I', score: 1 },
  { letter: 'V', score: 4 },
  { letter: 'E', score: 1 },
  { letter: 'S', score: 1 },
];

const initialMessages: Message[] = [
    { sender: 'Alex', text: 'Hey, good luck!' },
    { sender: 'You', text: 'You too!' },
    { sender: 'Alex', text: 'Nice first move.' },
];

const games = [
  {
    id: 1,
    opponent: { name: 'Alex', avatarId: 'user-2' },
    players: [
      { name: 'You', score: 125, avatarId: 'user-1' },
      { name: 'Alex', score: 98, avatarId: 'user-2' },
    ],
    isPlayerTurn: true,
  },
  {
    id: 2,
    opponent: { name: 'Foxy', avatarId: 'avatar-base' },
    players: [
      { name: 'You', score: 88, avatarId: 'user-1' },
      { name: 'Foxy', score: 112, avatarId: 'avatar-base' },
    ],
    isPlayerTurn: false,
  },
  {
    id: 3,
    opponent: { name: 'PixelProwler', avatarId: 'user-3' },
    players: [
      { name: 'You', score: 150, avatarId: 'user-1' },
      { name: 'PixelProwler', score: 149, avatarId: 'user-3' },
    ],
    isPlayerTurn: true,
  },
];

function GameInstance({ game }: { game: (typeof games)[0] }) {
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>(initialPlayerTiles);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
  const [draggedTile, setDraggedTile] = useState<{ tile: Tile; index: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { playSfx } = useAudio();

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
        Object.keys(GameBoard.defaultProps.placedTiles).includes(`${row}-${col}`);

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

  return (
    <div className="flex flex-col gap-4 h-full p-4 sm:p-8 pt-24 sm:pt-24">
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg px-4">
        <Scoreboard players={game.players} isPlayerTurn={game.isPlayerTurn} />
      </div>

      <div className="flex-grow">
        <Card className="h-full">
          <CardContent className="p-2 sm:p-4 h-full flex items-center justify-center">
            <GameBoard
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

export default function GamePage() {
  return (
    <main className="min-h-screen bg-background relative">
       <div className="absolute top-4 left-4 z-20">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      <div className="w-full h-screen">
        <Carousel className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent className="-ml-0 h-full">
            {games.map((game) => (
              <CarouselItem key={game.id} className="pl-0">
                <GameInstance game={game} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>
    </main>
  );
}
