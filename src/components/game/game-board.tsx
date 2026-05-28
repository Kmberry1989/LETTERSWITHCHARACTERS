'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React from 'react';
import type { Tile, PlacedTile } from '@/lib/game/types';
import { BOARD_LAYOUT } from '@/lib/game/constants';

export const boardLayout = BOARD_LAYOUT;

type GameBoardProps = {
  placedTiles?: Record<string, Tile>;
  pendingTiles?: PlacedTile[];
  onCellClick?: (row: number, col: number) => void;
  onDrop?: (row: number, col: number) => void;
  onRecallTile?: (tile: PlacedTile) => void;
};

function Cell({ type, children, onClick, onDrop, onDragOver }: { type: string; children?: React.ReactNode; onClick?: () => void, onDrop?: (e: React.DragEvent) => void, onDragOver?: (e: React.DragEvent) => void }) {
  const classMap: { [key: string]: string } = {
    'DL': 'board-cell-dl',
    'TL': 'board-cell-tl',
    'DW': 'board-cell-dw',
    'TW': 'board-cell-tw',
    '★': 'board-cell-start',
  };

  const labelMap: { [key: string]: { primary: string; secondary: string } } = {
    'DL': { primary: 'DL', secondary: 'Letter' },
    'TL': { primary: 'TL', secondary: 'Letter' },
    'DW': { primary: 'DW', secondary: 'Word' },
    'TW': { primary: 'TW', secondary: 'Word' },
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
        canInteract && !children && 'cursor-pointer hover:scale-[1.02]',
        !canInteract && 'cursor-not-allowed',
      )}
      onClick={canInteract ? onClick : undefined}
      onDrop={canInteract ? onDrop : undefined}
      onDragOver={canInteract ? onDragOver : undefined}
    >
      {children || (
        type === '★' ? (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <Star className="h-5 w-5 fill-current text-amber-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.55)] sm:h-6 sm:w-6" />
            <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-amber-50/95 drop-shadow-sm">
              Start
            </span>
          </div>
        ) : isMultiplier ? (
          <div className="flex flex-col items-center justify-center">
            <span className="text-[0.7rem] font-black tracking-[0.22em] sm:text-sm">
              {labelMap[type].primary}
            </span>
            <span className="text-[0.45rem] font-bold uppercase tracking-[0.28em] text-current/80 sm:text-[0.55rem]">
              {labelMap[type].secondary}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
}

function PlacedTileComponent({ tile, isPending, onClick }: { tile: Tile, isPending: boolean, onClick?: () => void }) {
  const canRecall = !!onClick;
  return (
    <div 
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-sm border-b-2 border-black/20 bg-[#f8e8c7] shadow-sm",
        isPending && canRecall && "cursor-pointer ring-2 ring-yellow-400 ring-offset-1",
        isPending && !canRecall && "ring-2 ring-yellow-400/50 ring-offset-1"
      )}
      onClick={onClick}
    >
      <span className={cn(
          "text-lg sm:text-2xl font-bold text-gray-800",
          tile.isBlank && "text-red-600"
      )}>{tile.letter}</span>
      <span className="absolute bottom-0 right-0.5 text-[0.5rem] sm:text-xs font-semibold text-gray-800">{tile.score}</span>
    </div>
  );
}

const GameBoard = ({ 
  placedTiles = {}, 
  pendingTiles = [],
  onCellClick,
  onDrop,
  onRecallTile
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
  };
  
  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    onDrop?.(row, col);
  };


  return (
    <div className="w-full aspect-square max-w-full">
      <div className="grid grid-cols-15 gap-0.5 sm:gap-1 p-1 sm:p-2 bg-[#b8a68b] rounded-md shadow-inner">
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
