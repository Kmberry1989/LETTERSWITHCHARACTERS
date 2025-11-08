'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tile as TileType } from './game-board';
import { RotateCcw, Shuffle } from 'lucide-react';

function Tile({ 
  tile, 
  isSelected, 
  onClick 
}: { 
  tile: TileType; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-md transition-transform duration-150 ease-in-out hover:scale-105",
        isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
        "active:scale-95"
      )}
    >
      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{tile.letter}</span>
      <span className="absolute bottom-0.5 right-1 text-[0.6rem] sm:text-xs font-semibold text-gray-800">{tile.score}</span>
    </div>
  );
}

function EmptySlot() {
  return <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-md bg-black/10" />;
}

type TileRackProps = {
  tiles: (TileType | null)[];
  selectedTileIndex: number | null;
  onTileSelect: (index: number) => void;
  onRecall: () => void;
  onShuffle: () => void;
};

export default function TileRack({ tiles, selectedTileIndex, onTileSelect, onRecall, onShuffle }: TileRackProps) {

  const handlePlay = () => {
    alert('Word Played!');
    // We'll add the real logic here later
  };

  return (
    <Card className="bg-[#c4a27a] border-2 border-[#a07e56]">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {tiles.map((tile, i) => (
                tile ? (
                  <Tile 
                    key={i} 
                    tile={tile} 
                    isSelected={selectedTileIndex === i}
                    onClick={() => onTileSelect(i)}
                  />
                ) : (
                  <EmptySlot key={i} />
                )
              ))}
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={onShuffle}>
                  <Shuffle className="mr-1 h-4 w-4" />
                  Shuffle
                </Button>
                <Button variant="secondary" size="sm" onClick={onRecall}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Recall
                </Button>
                <Button size="sm" onClick={handlePlay}>PLAY</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
