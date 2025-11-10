'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game/types';
import { ArrowRightLeft, Loader, MessageCircle, RotateCcw, Shuffle, Sparkles, X } from 'lucide-react';

function Tile({ 
  tile, 
  isSelected, 
  onClick,
  onDragStart,
  isExchanging,
  isExchangeSelected,
}: { 
  tile: TileType; 
  isSelected: boolean; 
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isExchanging: boolean;
  isExchangeSelected: boolean;
}) {
  const isBlank = tile.letter === ' ';
  return (
    <div 
      draggable={!isExchanging}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-md transition-all duration-150 ease-in-out hover:scale-105",
        isSelected && !isExchanging && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
        isExchangeSelected && "ring-2 ring-destructive ring-offset-2 scale-105 shadow-lg",
        isExchanging && !isExchangeSelected && "opacity-60",
        "active:scale-95"
      )}
    >
      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{isBlank ? '?' : tile.letter}</span>
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
  isGettingHint: boolean;
  hintUsed: boolean;
  isExchanging: boolean;
  exchangeSelection: number[];
  onTileSelect: (index: number) => void;
  onRecall: () => void;
  onShuffle: () => void;
  onDragStart: (tile: TileType, index: number) => void;
  onDrop: (index: number) => void;
  onChatClick: () => void;
  onPlay: () => void;
  onHint: () => void;
  onToggleExchange: () => void;
};

export default function TileRack({ tiles, selectedTileIndex, isPlayerTurn, isSubmitting, isGettingHint, hintUsed, isExchanging, exchangeSelection, onTileSelect, onRecall, onShuffle, onDragStart, onDrop, onChatClick, onPlay, onHint, onToggleExchange }: TileRackProps) {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const triggerPassDialog = () => {
    document.getElementById('pass-turn-trigger')?.click();
  };

  const triggerExchangeDialog = () => {
    if (exchangeSelection.length === 0) return;
    document.getElementById('exchange-tiles-trigger')?.click();
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
                      onDragStart={(e) => onDragStart(tile, i)}
                      isExchanging={isExchanging}
                      isExchangeSelected={exchangeSelection.includes(i)}
                    />
                  ) : (
                    <EmptySlot onDrop={(e) => { e.preventDefault(); onDrop(i); }} onDragOver={handleDragOver} />
                  )}
                </div>
              ))}
            </div>
            {isExchanging ? (
                 <div className="flex gap-4">
                    <Button variant="secondary" size="sm" onClick={onToggleExchange} className="shadow-sm">
                        <X className="mr-1 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={triggerExchangeDialog} 
                        disabled={exchangeSelection.length === 0 || isSubmitting} 
                        className="shadow-sm w-48"
                        variant="destructive"
                    >
                        {isSubmitting ? <Loader className="animate-spin" /> : `Exchange ${exchangeSelection.length} Tiles`}
                    </Button>
                 </div>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={onShuffle} className="shadow-sm">
                        <Shuffle className="mr-1 h-4 w-4" />
                        Shuffle
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onRecall} className="shadow-sm">
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Recall
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onHint} disabled={!isPlayerTurn || isGettingHint || hintUsed} className="shadow-sm">
                        {isGettingHint ? <Loader className="animate-spin mr-1 h-4 w-4" /> : <Sparkles className="mr-1 h-4 w-4" />}
                        Hint
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onChatClick} className="shadow-sm">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Chat
                        </Button>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onToggleExchange} disabled={!isPlayerTurn || isSubmitting} className="shadow-sm bg-background/50">
                            <ArrowRightLeft className="mr-1 h-4 w-4" />
                            Exchange
                        </Button>
                        <Button variant="outline" size="sm" onClick={triggerPassDialog} disabled={!isPlayerTurn || isSubmitting} className="shadow-sm bg-background/50">
                            Pass
                        </Button>
                        <Button size="sm" onClick={onPlay} disabled={!isPlayerTurn || isSubmitting} className="shadow-sm w-24">
                        {isSubmitting ? <Loader className="animate-spin" /> : 'PLAY'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
