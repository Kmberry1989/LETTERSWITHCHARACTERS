'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tile as TileType } from './game-board';
import { RotateCcw } from 'lucide-react';

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
        "relative flex h-12 w-12 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-md transition-transform duration-150 ease-in-out hover:scale-105 sm:h-16 sm:w-16",
        isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
        "active:scale-95"
      )}
    >
      <span className="text-3xl font-bold text-gray-800">{tile.letter}</span>
      <span className="absolute bottom-1 right-1.5 text-xs font-semibold text-gray-800">{tile.score}</span>
    </div>
  );
}

function EmptySlot() {
  return <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-black/10" />;
}

type TileRackProps = {
  tiles: (TileType | null)[];
  selectedTileIndex: number | null;
  onTileSelect: (index: number) => void;
  onRecall: () => void;
  onShuffle: () => void;
};

export default function TileRack({ tiles, selectedTileIndex, onTileSelect, onRecall, onShuffle }: TileRackProps) {
  return (
    <Card className="bg-[#c4a27a] border-2 border-[#a07e56]">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
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
                <Button variant="secondary" size="sm" onClick={onShuffle}>Shuffle</Button>
                <Button variant="secondary" size="sm" onClick={onRecall}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Recall
                </Button>
                <Button size="sm">Play Word</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
