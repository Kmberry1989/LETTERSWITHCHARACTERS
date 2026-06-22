'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game/types';
import { ArrowRightLeft, Check, Loader, MessageCircle, Play, RotateCcw, Shuffle, SkipForward, X } from 'lucide-react';
import { ThemedTileFace } from '@/components/game/themed-tile-face';

function Tile({
  tile,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  canDrag,
  isExchanging,
  isExchangeSelected,
  tileSetId,
  isNew = false,
}: {
  tile: TileType;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
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
      onClick={onSelect}
      onDragStartCapture={onDragStart}
      onDragEnd={onDragEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={cn(
        "relative flex aspect-square w-full min-w-0 max-w-none cursor-pointer select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-150 ease-in-out md:max-w-[4.85rem]",
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
    className="aspect-square w-full min-w-0 max-w-none rounded-md bg-black/10 md:max-w-[4.85rem]"
    />;
}

function CompactActionButton({
  label,
  children,
  className,
  badge,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <Button
      size="icon"
      title={label}
      aria-label={label}
      className={cn(
        'relative h-10 w-10 shrink-0 rounded-xl shadow-sm md:h-11 md:w-11',
        className
      )}
      {...props}
    >
      {children}
      {badge ? (
        <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[0.62rem] font-black leading-none text-white">
          {badge}
        </span>
      ) : null}
      <span className="sr-only">{label}</span>
    </Button>
  );
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
  onBoardPlace: (row: number, col: number, index: number) => void;
  onChatClick: () => void;
  onPlay: () => void;
  onToggleExchange: () => void;
  tileSetId?: string | null;
  shuffleTick: number;
  replenishedTileIndexes?: number[];
};

type TouchDragState = {
  index: number;
  tile: TileType;
  tileSetId?: string | null;
  x: number;
  y: number;
};

export default function TileRack({ tiles, selectedTileIndex, isPlayerTurn, isSubmitting, isExchanging, exchangeSelection, onTileSelect, onRecall, onShuffle, onDragStart, onDragEnd, onDrop, onBoardPlace, onChatClick, onPlay, onToggleExchange, tileSetId, shuffleTick, replenishedTileIndexes = [] }: TileRackProps) {
  const canMoveTiles = isPlayerTurn && !isSubmitting && !isExchanging;
  const [touchDrag, setTouchDrag] = React.useState<TouchDragState | null>(null);
  const touchSessionRef = React.useRef<{
    pointerId: number;
    index: number;
    tile: TileType;
    tileSetId?: string | null;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const suppressClickRef = React.useRef(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>, tile: TileType, index: number) => {
    if (event.pointerType === 'mouse' || !canMoveTiles) return;
    touchSessionRef.current = {
      pointerId: event.pointerId,
      index,
      tile,
      tileSetId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTouchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = touchSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;
    const movedFarEnough = Math.hypot(deltaX, deltaY) > 14;

    if (!session.dragging && movedFarEnough) {
      session.dragging = true;
      onDragStart(session.tile, session.index);
    }

    if (!session.dragging) return;

    event.preventDefault();
    setTouchDrag({
      index: session.index,
      tile: session.tile,
      tileSetId: session.tileSetId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const finishTouchInteraction = (clientX: number, clientY: number, wasDragging: boolean) => {
    const session = touchSessionRef.current;
    if (!session) return;

    if (wasDragging) {
      suppressClickRef.current = true;
      const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const boardCell = target?.closest<HTMLElement>('[data-board-cell-placeable="true"]');
      if (boardCell) {
        const row = Number(boardCell.dataset.boardRow);
        const col = Number(boardCell.dataset.boardCol);
        if (!Number.isNaN(row) && !Number.isNaN(col)) {
          onBoardPlace(row, col, session.index);
        }
      } else {
        const rackSlot = target?.closest<HTMLElement>('[data-rack-slot-index]');
        const slotIndex = rackSlot ? Number(rackSlot.dataset.rackSlotIndex) : Number.NaN;
        if (!Number.isNaN(slotIndex)) {
          onDrop(slotIndex);
        }
      }
      onDragEnd();
    }

    setTouchDrag(null);
    touchSessionRef.current = null;
  };

  const handleTouchPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = touchSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    finishTouchInteraction(event.clientX, event.clientY, session.dragging);
  };

  const handleTouchPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = touchSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    finishTouchInteraction(event.clientX, event.clientY, session.dragging);
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
      <CardContent className="p-1.5 sm:p-4 md:p-5">
        <div className="flex flex-col items-center gap-1.5 sm:gap-4 md:gap-5">
            <motion.div
              key={shuffleTick}
              initial={shuffleTick > 0 ? { opacity: 0.88, y: -8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid w-full grid-cols-7 items-center justify-center gap-0.5 px-0.5 sm:gap-2 md:gap-3 md:px-3"
            >
              <AnimatePresence initial={false}>
              {tiles.map((tile, i) => (
                <motion.div
                  layout
                  key={getTileRenderKey(tile, i)}
                  className="min-w-0"
                  data-rack-slot-index={i}
                  onDrop={(e) => { e.preventDefault(); onDrop(i); }}
                  onDragOver={handleDragOver}
                >
                  {tile ? (
                    <Tile
                      tile={tile}
                      isSelected={selectedTileIndex === i}
                      onSelect={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
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
                      onPointerDown={(event) => handleTouchPointerDown(event, tile, i)}
                      onPointerMove={handleTouchPointerMove}
                      onPointerUp={handleTouchPointerUp}
                      onPointerCancel={handleTouchPointerCancel}
                    />
                  ) : (
                    <EmptySlot onDrop={(e) => { e.preventDefault(); onDrop(i); }} onDragOver={handleDragOver} />
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
            {isExchanging ? (
                 <div className="flex w-full items-center justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <CompactActionButton variant="secondary" onClick={onToggleExchange} label="Cancel exchange">
                      <X className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton
                      variant="destructive"
                      onClick={triggerExchangeDialog}
                      disabled={exchangeSelection.length === 0 || isSubmitting}
                      className="h-10 w-10 md:h-11 md:w-11"
                      label={`Confirm exchange of ${exchangeSelection.length} tile${exchangeSelection.length === 1 ? '' : 's'}`}
                      badge={exchangeSelection.length > 0 ? exchangeSelection.length : undefined}
                    >
                      {isSubmitting ? <Loader className="h-4.5 w-4.5 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
                    </CompactActionButton>
                 </div>
            ) : (
                <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <CompactActionButton variant="secondary" onClick={onShuffle} label="Shuffle rack">
                      <Shuffle className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton variant="secondary" onClick={onRecall} label="Recall tiles">
                      <RotateCcw className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton variant="secondary" onClick={onChatClick} label="Open chat">
                      <MessageCircle className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton
                      variant="outline"
                      onClick={onToggleExchange}
                      disabled={!isPlayerTurn || isSubmitting}
                      className="bg-background/60"
                      label="Exchange tiles"
                    >
                      <ArrowRightLeft className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton
                      variant="outline"
                      onClick={triggerPassDialog}
                      disabled={!isPlayerTurn || isSubmitting}
                      className="bg-background/60"
                      label="Pass turn"
                    >
                      <SkipForward className="h-4.5 w-4.5" />
                    </CompactActionButton>
                    <CompactActionButton
                      onClick={onPlay}
                      disabled={!isPlayerTurn || isSubmitting}
                      className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                      label="Play word"
                    >
                      {isSubmitting ? <Loader className="h-4.5 w-4.5 animate-spin" /> : <Play className="h-4.5 w-4.5 fill-current" />}
                    </CompactActionButton>
                </div>
            )}
        </div>
      </CardContent>
      {touchDrag ? (
        <div className="pointer-events-none fixed inset-0 z-[70]">
          <div
            className="absolute h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 rotate-3 opacity-95"
            style={{ left: touchDrag.x, top: touchDrag.y }}
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-xl border-b-4 border-black/20 bg-[#f8e8c7] shadow-[0_16px_26px_rgba(15,23,42,0.28)]">
              <ThemedTileFace
                tileSetId={touchDrag.tileSetId}
                letter={touchDrag.tile.letter}
                score={touchDrag.tile.score}
                isBlank={touchDrag.tile.letter === ' '}
                showScore
              />
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
