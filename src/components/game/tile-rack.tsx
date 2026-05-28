'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game/types';
import { ArrowRightLeft, Loader, MessageCircle, RotateCcw, Shuffle, X } from 'lucide-react';
import { ThemedTileFace } from '@/components/game/themed-tile-face';

function Tile({ 
  tile, 
  isSelected, 
  onClick,
  onDragStart,
  onDragEnd,
  canDrag,
  isExchanging,
  isExchangeSelected,
  tileSetId,
}: { 
  tile: TileType; 
  isSelected: boolean; 
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  canDrag: boolean;
  isExchanging: boolean;
  isExchangeSelected: boolean;
  tileSetId?: string | null;
  }) {
  const isBlank = tile.letter === ' ';
  return (
    <div
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-150 ease-in-out",
        isSelected && !isExchanging && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
        isExchangeSelected && "ring-2 ring-destructive ring-offset-2 scale-105 shadow-lg",
        isExchanging && !isExchangeSelected && "opacity-60",
        !canDrag && "cursor-default hover:scale-100",
        "active:scale-95"
      )}
    >
      <motion.div
        className="relative flex h-full w-full items-center justify-center rounded-md"
      >
        <ThemedTileFace
          tileSetId={tileSetId}
          letter={tile.letter}
          score={tile.score}
          isBlank={isBlank}
          interactive={canDrag}
          showScore
        />
      </motion.div>
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
  isExchanging: boolean;
  exchangeSelection: number[];
  onTileSelect: (index: number) => void;
  onRecall: () => void;
  onShuffle: () => void;
  onDragStart: (tile: TileType, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  onChatClick: () => void;
  onPlay: () => void;
  onToggleExchange: () => void;
  tileSetId?: string | null;
  shuffleTick: number;
};

export default function TileRack({ tiles, selectedTileIndex, isPlayerTurn, isSubmitting, isExchanging, exchangeSelection, onTileSelect, onRecall, onShuffle, onDragStart, onDragEnd, onDrop, onChatClick, onPlay, onToggleExchange, tileSetId, shuffleTick }: TileRackProps) {
  const canMoveTiles = isPlayerTurn && !isSubmitting && !isExchanging;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
            <motion.div
              key={shuffleTick}
              initial={shuffleTick > 0 ? { opacity: 0.88, y: -8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center justify-center gap-1 sm:gap-2"
            >
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
                      onDragStart={(e) => {
                        if (!canMoveTiles) {
                          e.preventDefault();
                          return;
                        }

                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(i));
                        onDragStart(tile, i);
                      }}
                      onDragEnd={onDragEnd}
                      canDrag={canMoveTiles}
                      isExchanging={isExchanging}
                      isExchangeSelected={exchangeSelection.includes(i)}
                      tileSetId={tileSetId}
                    />
                  ) : (
                    <EmptySlot onDrop={(e) => { e.preventDefault(); onDrop(i); }} onDragOver={handleDragOver} />
                  )}
                </div>
              ))}
            </motion.div>
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
