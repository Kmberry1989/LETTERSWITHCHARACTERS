'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import type { Tile, PlacedTile } from '@/lib/game/types';
import { BOARD_LAYOUT } from '@/lib/game/constants';
import { ThemedTileFace } from '@/components/game/themed-tile-face';

export const boardLayout = BOARD_LAYOUT;

type GameBoardProps = {
  placedTiles?: Record<string, Tile>;
  pendingTiles?: PlacedTile[];
  onCellClick?: (row: number, col: number) => void;
  onDrop?: (row: number, col: number, tileIndex?: number | null) => void;
  onRecallTile?: (tile: PlacedTile) => void;
  tileSetId?: string | null;
  ownerTileSetIds?: Record<string, string | null | undefined>;
};

function Cell({ type, children, onClick, onDrop, onDragOver }: { type: string; children?: React.ReactNode; onClick?: () => void, onDrop?: (e: React.DragEvent) => void, onDragOver?: (e: React.DragEvent) => void }) {
  const classMap: { [key: string]: string } = {
    'DL': 'board-cell-dl',
    'TL': 'board-cell-tl',
    'DW': 'board-cell-dw',
    'TW': 'board-cell-tw',
    '★': 'board-cell-start',
  };

  const canInteract = !!(onClick || onDrop);
  const isMultiplier = type === 'DL' || type === 'TL' || type === 'DW' || type === 'TW';

  return (
    <div
      className={cn(
        'relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-sm text-center leading-none',
        'border border-[#d1c6b4] bg-[#d8cebc] text-white/30',
        'transition-transform duration-150',
        classMap[type],
        canInteract && !children && 'cursor-pointer hover:scale-[1.02] hover:z-10',
        !canInteract && 'cursor-not-allowed',
      )}
      data-board-interactive="true"
      onClick={canInteract ? onClick : undefined}
      onDrop={canInteract ? onDrop : undefined}
      onDragOver={canInteract ? onDragOver : undefined}
    >
      {children || (
        type === '★' ? (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-current text-amber-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.55)] min-[420px]:h-4.5 min-[420px]:w-4.5 sm:h-6 sm:w-6" />
            <span className="text-[0.4rem] font-black uppercase tracking-[0.12em] text-amber-50 [text-shadow:-1px_-1px_0_rgba(120,53,15,0.45),1px_-1px_0_rgba(120,53,15,0.45),-1px_1px_0_rgba(120,53,15,0.45),1px_1px_0_rgba(120,53,15,0.45)] min-[420px]:text-[0.5rem] sm:text-[0.62rem] sm:tracking-[0.22em]">
              STAR
            </span>
          </div>
        ) : isMultiplier ? (
          <div className="flex items-center justify-center">
            <span className="text-[0.42rem] font-black tracking-[0.08em] text-white [text-shadow:-1px_-1px_0_rgba(15,23,42,0.45),1px_-1px_0_rgba(15,23,42,0.45),-1px_1px_0_rgba(15,23,42,0.45),1px_1px_0_rgba(15,23,42,0.45)] min-[420px]:text-[0.56rem] sm:text-sm sm:tracking-[0.16em]">
              {type}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
}

function PlacedTileComponent({
  tile,
  isPending,
  onClick,
  tileSetId,
  ownerTileSetIds,
}: {
  tile: Tile,
  isPending: boolean,
  onClick?: () => void,
  tileSetId?: string | null,
  ownerTileSetIds?: Record<string, string | null | undefined>,
}) {
  const canRecall = !!onClick;
  const resolvedTileSetId = tile.tileSetId || (tile.ownerUid ? ownerTileSetIds?.[tile.ownerUid] : undefined) || tileSetId;
  return (
    <motion.div 
      layout
      initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ scale: canRecall ? 1.03 : 1 }}
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-sm border-b-2 border-black/20 bg-[#f8e8c7] shadow-[0_10px_18px_rgba(0,0,0,0.16)]",
        isPending && canRecall && "cursor-pointer ring-2 ring-yellow-400 ring-offset-1",
        isPending && !canRecall && "ring-2 ring-yellow-400/50 ring-offset-1",
        "before:absolute before:inset-0 before:rounded-sm before:bg-gradient-to-br before:from-white/55 before:via-transparent before:to-transparent"
      )}
      onClick={onClick}
    >
      <ThemedTileFace
        tileSetId={resolvedTileSetId}
        letter={tile.letter}
        score={tile.score}
        isBlank={tile.isBlank}
        showScore={isPending}
      />
    </motion.div>
  );
}

const GameBoard = ({ 
  placedTiles = {}, 
  pendingTiles = [],
  onCellClick,
  onDrop,
  onRecallTile,
  tileSetId,
  ownerTileSetIds,
}: GameBoardProps) => {
  const allTiles = { ...placedTiles };
  const pendingKeys = new Set();
  pendingTiles.forEach(tile => {
    const key = `${tile.row}-${tile.col}`;
    allTiles[key] = tile;
    pendingKeys.add(key);
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    onDrop?.(row, col, Number.isNaN(sourceIndex) ? null : sourceIndex);
  };


  return (
    <div className="w-full aspect-square max-w-full">
      <div className="grid grid-cols-15 gap-px rounded-[0.45rem] bg-[#b8a68b]/75 p-0.5 shadow-inner min-[420px]:gap-0.5 sm:gap-1 sm:rounded-[0.9rem] sm:p-2">
        {boardLayout.map((row, rowIndex) =>
          row.map((cellType, colIndex) => {
            const tileKey = `${rowIndex}-${colIndex}`;
            const tile = allTiles[tileKey];
            const isPending = pendingKeys.has(tileKey);
            const canPlace = (onCellClick || onDrop) && !tile;
            
            return (
              <Cell 
                key={`${rowIndex}-${colIndex}`} 
                type={cellType}
                onClick={canPlace && onCellClick ? () => onCellClick(rowIndex, colIndex) : undefined}
                onDrop={canPlace && onDrop ? (e) => handleDrop(e, rowIndex, colIndex) : undefined}
                onDragOver={canPlace && onDrop ? handleDragOver : undefined}
              >
                {tile && (
                  <PlacedTileComponent 
                    tile={tile} 
                    isPending={isPending}
                    tileSetId={tileSetId}
                    ownerTileSetIds={ownerTileSetIds}
                    onClick={isPending && onRecallTile ? () => onRecallTile({ ...tile, row: rowIndex, col: colIndex }) : undefined}
                  />
                )}
              </Cell>
            );
          })
        )}
      </div>
    </div>
  );
}

GameBoard.defaultProps = {
  placedTiles: {},
  pendingTiles: [],
};


export default GameBoard;
