'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game/types';
import { ArrowRightLeft, Loader, MessageCircle, RotateCcw, Shuffle, X } from 'lucide-react';
import { ThemedTileFace } from '@/components/game/themed-tile-face';

function Tile({
  tile,
  isSelected,
  onPointerDown,
  onDragStart,
  onDragEnd,
  canDrag,
  isExchanging,
  isExchangeSelected,
  tileSetId,
  isNew = false,
}: {
  tile: TileType;
  isSelected: boolean;
  onPointerDown: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  canDrag: boolean;
  isExchanging: boolean;
  isExchangeSelected: boolean;
  tileSetId?: string | null;
  isNew?: boolean;
  }) {
  const isBlank = tile.letter === ' ';
  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -28, scale: 0.82, rotate: -5 } : { opacity: 0.92, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: isSelected || isExchangeSelected ? 1.05 : 1, rotate: 0 }}
      exit={{ opacity: 0, y: 18, scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
      draggable={canDrag}
      onPointerDown={onPointerDown}
      onDragStartCapture={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex aspect-square w-full min-w-0 max-w-14 cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-150 ease-in-out md:max-w-[4.85rem]",
        isSelected && !isExchanging && "ring-2 ring-primary ring-offset-2 shadow-lg",
        isExchangeSelected && "ring-2 ring-destructive ring-offset-2 shadow-lg",
        isExchanging && !isExchangeSelected && "opacity-60",
        !canDrag && "cursor-default hover:scale-100",
        "active:scale-95"
      )}
      data-board-interactive="true"
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
    </motion.div>
  );
}

function EmptySlot({ onDrop, onDragOver }: { onDrop: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void }) {
  return <div
    onDrop={onDrop}
    onDragOver={onDragOver}
    className="aspect-square w-full min-w-0 max-w-14 rounded-md bg-black/10 md:max-w-[4.85rem]"
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
  replenishedTileIndexes?: number[];
};

export default function TileRack({ tiles, selectedTileIndex, isPlayerTurn, isSubmitting, isExchanging, exchangeSelection, onTileSelect, onRecall, onShuffle, onDragStart, onDragEnd, onDrop, onChatClick, onPlay, onToggleExchange, tileSetId, shuffleTick, replenishedTileIndexes = [] }: TileRackProps) {
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

  const tileOccurrenceCounts = new Map<string, number>();
  const getTileRenderKey = (tile: TileType | null, index: number) => {
    if (!tile) return `empty-${index}`;
    const tileSignature = `${tile.letter}-${tile.score}-${tile.isBlank ? 'blank' : 'tile'}`;
    if (replenishedTileIndexes.includes(index)) {
      return `new-${shuffleTick}-${index}-${tileSignature}`;
    }

    const occurrence = tileOccurrenceCounts.get(tileSignature) || 0;
    tileOccurrenceCounts.set(tileSignature, occurrence + 1);
    return `${tileSignature}-${occurrence}`;
  };

  return (
    <Card className="overflow-hidden border-2 border-[#a07e56] bg-[#c4a27a] shadow-sm">
      <CardContent className="p-2 sm:p-4 md:p-5">
        <div className="flex flex-col items-center gap-2 sm:gap-4 md:gap-5">
            <motion.div
              key={shuffleTick}
              initial={shuffleTick > 0 ? { opacity: 0.88, y: -8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid w-full grid-cols-7 items-center justify-center gap-1 px-1 sm:gap-2 md:gap-3 md:px-3"
            >
              <AnimatePresence initial={false}>
              {tiles.map((tile, i) => (
                <motion.div
                  layout
                  key={getTileRenderKey(tile, i)}
                  className="min-w-0"
                  onDrop={(e) => { e.preventDefault(); onDrop(i); }}
                  onDragOver={handleDragOver}
                >
                  {tile ? (
                    <Tile
                      tile={tile}
                      isSelected={selectedTileIndex === i}
                      onPointerDown={() => {
                        if (!canMoveTiles && !isExchanging) return;
                        onTileSelect(i);
                      }}
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
                      isNew={replenishedTileIndexes.includes(i)}
                    />
                  ) : (
                    <EmptySlot onDrop={(e) => { e.preventDefault(); onDrop(i); }} onDragOver={handleDragOver} />
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
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
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-5">
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={onShuffle} className="shadow-sm md:h-11 md:px-5 md:text-base">
                        <Shuffle className="mr-1 h-4 w-4" />
                        Shuffle
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onRecall} className="shadow-sm md:h-11 md:px-5 md:text-base">
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Recall
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onChatClick} className="shadow-sm md:h-11 md:px-5 md:text-base">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Chat
                        </Button>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onToggleExchange} disabled={!isPlayerTurn || isSubmitting} className="bg-background/50 shadow-sm md:h-11 md:px-5 md:text-base">
                            <ArrowRightLeft className="mr-1 h-4 w-4" />
                            Exchange
                        </Button>
                        <Button variant="outline" size="sm" onClick={triggerPassDialog} disabled={!isPlayerTurn || isSubmitting} className="bg-background/50 shadow-sm md:h-11 md:px-5 md:text-base">
                            Pass
                        </Button>
                        <Button size="sm" onClick={onPlay} disabled={!isPlayerTurn || isSubmitting} className="w-24 shadow-sm md:h-11 md:w-32 md:text-base">
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
