'use client';

import { useState } from 'react';
import AppLayout from '@/components/app-layout';
import GameActions from '@/components/game/game-actions';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import { Card, CardContent } from '@/components/ui/card';

const initialPlayerTiles: (Tile | null)[] = [
  { letter: 'A', score: 1 },
  { letter: 'C', score: 3 },
  { letter: 'T', score: 1 },
  { letter: 'I', score: 1 },
  { letter: 'V', score: 4 },
  { letter: 'E', score: 1 },
  { letter: 'S', score: 1 },
];

export default function GamePage() {
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>(initialPlayerTiles);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);

  const handleTileSelect = (index: number) => {
    if (playerTiles[index]) {
      setSelectedTileIndex(index);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedTileIndex !== null) {
      const tileToPlace = playerTiles[selectedTileIndex];
      if (tileToPlace) {
        // Place tile on board
        setPendingTiles([...pendingTiles, { ...tileToPlace, row, col }]);
        
        // Remove tile from rack
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[selectedTileIndex] = null;
        setPlayerTiles(newPlayerTiles);
        
        // Deselect
        setSelectedTileIndex(null);
      }
    }
  };

  const handleRecall = () => {
    if (pendingTiles.length === 0) return;
    
    const newPlayerTiles = [...playerTiles];
    pendingTiles.forEach(pendingTile => {
      const emptyIndex = newPlayerTiles.findIndex(t => t === null);
      if (emptyIndex !== -1) {
        newPlayerTiles[emptyIndex] = { letter: pendingTile.letter, score: pendingTile.score };
      }
    });

    setPlayerTiles(newPlayerTiles);
    setPendingTiles([]);
  };

  const handleShuffle = () => {
    const shuffledTiles = [...playerTiles].filter(t => t !== null) as Tile[];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
    }
    const newPlayerTiles = [...playerTiles];
    let tileIndex = 0;
    for(let i=0; i < newPlayerTiles.length; i++){
      if(newPlayerTiles[i] !== null){
        newPlayerTiles[i] = shuffledTiles[tileIndex++];
      }
    }
    setPlayerTiles(newPlayerTiles);
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-2 sm:p-4">
                <GameBoard pendingTiles={pendingTiles} onCellClick={handleCellClick} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Scoreboard />
            <GameActions />
          </div>
        </div>
        <TileRack 
          tiles={playerTiles}
          selectedTileIndex={selectedTileIndex}
          onTileSelect={handleTileSelect}
          onRecall={handleRecall}
          onShuffle={handleShuffle}
        />
      </div>
    </AppLayout>
  );
}
