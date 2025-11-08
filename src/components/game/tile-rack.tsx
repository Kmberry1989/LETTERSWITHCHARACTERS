'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tile as TileType } from './game-board';
import { Loader, MessageCircle, RotateCcw, Shuffle } from 'lucide-react';

function Tile({ 
  tile, 
  isSelected, 
  onClick,
  onDragStart,
}: { 
  tile: TileType; 
  isSelected: boolean; 
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const isBlank = tile.letter === ' ';
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-md transition-transform duration-150 ease-in-out hover:scale-105",
        isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
        "active:scale-95"
      )}
    >
      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{isBlank ? '' : tile.letter}</span>
      <span className="absolute bottom-0.5 right-1 text-[0.6rem] sm:text-xs font-semibold text-gray-800">{tile.score}</span>
    </div>
  );
}

function EmptySlot({ onDrop, onDragOver }: { onDrop: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void }) {
  return <div 
    onDrop={onDrop}
    onDragOver={onDragOver}
    className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-md bg-black/10" 
    />;
}


type TileRackProps = {
  tiles: (TileType | null)[];
  selectedTileIndex: number | null;
  isPlayerTurn: boolean;
  isSubmitting: boolean;
  onTileSelect: (index: number) => void;
  onRecall: () => void;
  onShuffle: () => void;
  onDragStart: (tile: TileType, index: number) => void;
  onDrop: (index: number) => void;
  onChatClick: () => void;
  onPlay: () => void;
};

export default function TileRack({ tiles, selectedTileIndex, isPlayerTurn, isSubmitting, onTileSelect, onRecall, onShuffle, onDragStart, onDrop, onChatClick, onPlay }: TileRackProps) {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="bg-[#c4a27a] border-2 border-[#a07e56] shadow-sm">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {tiles.map((tile, i) => (
                <div 
                  key={i} 
                  onDrop={(e) => { e.preventDefault(); onDrop(i); }} 
                  onDragOver={handleDragOver}
                >
                  {tile ? (
                    <Tile 
                      tile={tile} 
                      isSelected={selectedTileIndex === i}
                      onClick={() => onTileSelect(i)}
                      onDragStart={() => onDragStart(tile, i)}
                    />
                  ) : (
                    <EmptySlot onDrop={(e) => { e.preventDefault(); onDrop(i); }} onDragOver={handleDragOver} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
                <Button variant="secondary" size="sm" onClick={onShuffle} className="shadow-sm">
                  <Shuffle className="mr-1 h-4 w-4" />
                  Shuffle
                </Button>
                <Button variant="secondary" size="sm" onClick={onRecall} className="shadow-sm">
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Recall
                </Button>
                 <Button variant="secondary" size="sm" onClick={onChatClick} className="shadow-sm">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Chat
                </Button>
                <Button size="sm" onClick={onPlay} disabled={!isPlayerTurn || isSubmitting} className="shadow-sm w-24">
                  {isSubmitting ? <Loader className="animate-spin" /> : 'PLAY'}
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
