'use client';

import { useState } from 'react';
import AppLayout from '@/components/app-layout';
import GameActions from '@/components/game/game-actions';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const initialPlayerTiles: (Tile | null)[] = [
  { letter: 'A', score: 1 },
  { letter: 'C', score: 3 },
  { letter: 'T', score: 1 },
  { letter: 'I', score: 1 },
  { letter: 'V', score: 4 },
  { letter: 'E', score: 1 },
  { letter: 'S', score: 1 },
];

const games = [
  {
    id: 1,
    opponent: { name: 'Alex', avatarId: 'user-2' },
    players: [
      { name: 'You', score: 125, avatarId: 'user-1' },
      { name: 'Alex', score: 98, avatarId: 'user-2' },
    ],
  },
  {
    id: 2,
    opponent: { name: 'Foxy', avatarId: 'avatar-base' },
    players: [
      { name: 'You', score: 88, avatarId: 'user-1' },
      { name: 'Foxy', score: 112, avatarId: 'avatar-base' },
    ],
  },
  {
    id: 3,
    opponent: { name: 'PixelProwler', avatarId: 'user-3' },
    players: [
      { name: 'You', score: 150, avatarId: 'user-1' },
      { name: 'PixelProwler', score: 149, avatarId: 'user-3' },
    ],
  },
];

function GameInstance({ game }: { game: typeof games[0] }) {
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>(initialPlayerTiles);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
  const opponentAvatar = PlaceHolderImages.find((p) => p.id === game.opponent.avatarId);
  const [draggedTile, setDraggedTile] = useState<{ tile: Tile; index: number } | null>(null);

  const handleTileSelect = (index: number) => {
    if (playerTiles[index]) {
      if (selectedTileIndex === index) {
        setSelectedTileIndex(null);
      } else {
        setSelectedTileIndex(index);
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
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-center gap-2 text-lg font-semibold">
        <Avatar className="h-8 w-8">
          {opponentAvatar && (
            <AvatarImage
              src={opponentAvatar.imageUrl}
              alt={game.opponent.name}
              data-ai-hint={opponentAvatar.imageHint}
            />
          )}
          <AvatarFallback>{game.opponent.name.charAt(0)}</AvatarFallback>
        </Avatar>
        Your game with {game.opponent.name}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 flex-grow">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-2 sm:p-4">
              <GameBoard
                pendingTiles={pendingTiles}
                onCellClick={handleCellClick}
                onDrop={handleDropOnBoard}
                onRecallTile={handleRecallTile}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Scoreboard players={game.players} />
          <GameActions />
        </div>
      </div>
      <TileRack
        tiles={playerTiles}
        selectedTileIndex={selectedTileIndex}
        onTileSelect={handleTileSelect}
        onRecall={handleRecallAll}
        onShuffle={handleShuffle}
        onDragStart={handleDragStart}
        onDrop={handleDropOnRack}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <AppLayout>
      <div className="flex-1 p-4 sm:p-8 h-[calc(100vh-4rem)]">
        <Carousel className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent className="-ml-4 h-full">
            {games.map((game) => (
              <CarouselItem key={game.id} className="pl-4">
                <GameInstance game={game} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="visible" />
          <CarouselNext className="visible" />
        </Carousel>
      </div>
    </AppLayout>
  );
}
