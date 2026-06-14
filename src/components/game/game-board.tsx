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
  onPendingTileSelect?: (tile: PlacedTile) => void;
  tileSetId?: string | null;
  ownerTileSetIds?: Record<string, string | null | undefined>;
  selectedPendingTileKey?: string | null;
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
        'relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-[0.18rem] text-center leading-none sm:rounded-sm',
        '[border-color:var(--board-cell-border)] [background:var(--board-cell-base)] [color:var(--board-cell-label)] border',
        'transition-transform duration-150',
        classMap[type],
        canInteract && !children && 'cursor-pointer md:hover:scale-[1.02] md:hover:z-10',
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
  onDragStart,
  isSelected,
  tileSetId,
  ownerTileSetIds,
}: {
  tile: Tile,
  isPending: boolean,
  onClick?: () => void,
  onDragStart?: (e: React.DragEvent) => void,
  isSelected?: boolean,
  tileSetId?: string | null,
  ownerTileSetIds?: Record<string, string | null | undefined>,
}) {
  const canInteract = !!onClick;
  const resolvedTileSetId = tile.tileSetId || (tile.ownerUid ? ownerTileSetIds?.[tile.ownerUid] : undefined) || tileSetId;
  return (
    <motion.div 
      layout
      initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ scale: canInteract ? 1.03 : 1 }}
      draggable={isPending}
      onDragStartCapture={onDragStart}
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-[0.2rem] border-b-2 border-black/20 bg-[#f8e8c7] shadow-[0_10px_18px_rgba(0,0,0,0.16)] sm:rounded-sm",
        isPending && canInteract && "cursor-pointer ring-2 ring-yellow-400 ring-offset-1",
        isPending && !canInteract && "ring-2 ring-yellow-400/50 ring-offset-1",
        isSelected && "ring-2 ring-primary ring-offset-2",
        "before:absolute before:inset-0 before:rounded-[0.2rem] before:bg-gradient-to-br before:from-white/55 before:via-transparent before:to-transparent sm:before:rounded-sm"
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
  onPendingTileSelect,
  tileSetId,
  ownerTileSetIds,
  selectedPendingTileKey,
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
    const pendingSource = e.dataTransfer.getData('application/x-pending-tile');
    if (pendingSource) {
      const [pendingRow, pendingCol] = pendingSource.split('-').map(Number);
      onPendingTileSelect?.({ row: pendingRow, col: pendingCol, letter: '', score: 0 });
      onCellClick?.(row, col);
      return;
    }
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    onDrop?.(row, col, Number.isNaN(sourceIndex) ? null : sourceIndex);
  };


  return (
    <div className="aspect-square w-full max-w-full">
      <div className="grid grid-cols-15 gap-px rounded-[0.45rem] [background:var(--board-grid-bg)] p-0.5 shadow-inner min-[420px]:gap-0.5 sm:gap-1 sm:rounded-[0.9rem] sm:p-2">
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
                    isSelected={selectedPendingTileKey === tileKey}
                    tileSetId={tileSetId}
                    ownerTileSetIds={ownerTileSetIds}
                    onClick={isPending && onPendingTileSelect ? () => onPendingTileSelect({ ...tile, row: rowIndex, col: colIndex }) : undefined}
                    onDragStart={isPending ? (e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('application/x-pending-tile', `${rowIndex}-${colIndex}`);
                    } : undefined}
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
