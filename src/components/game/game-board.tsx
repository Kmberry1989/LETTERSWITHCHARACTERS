'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React from 'react';

// Simplified types for now
export type Tile = { letter: string; score: number };
export type PlacedTile = Tile & { row: number; col: number };

const boardLayout = [
  ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
  ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
  ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
  ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '','', 'DL'],
  ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
  ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
  ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
  ['TW', '', '', 'DL', '', '', '', '★', '', '', '', 'DL', '', '', 'TW'],
  ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
  ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
  ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
  ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
  ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
  ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
  ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
];

const initialPlacedTiles: Record<string, Tile> = {
  '7-4': { letter: 'L', score: 1 },
  '7-5': { letter: 'E', score: 1 },
  '7-6': { letter: 'T', score: 1 },
  '7-7': { letter: 'T', score: 1 },
  '7-8': { letter: 'E', score: 1 },
  '7-9': { letter: 'R', score: 1 },
  '7-10': { letter: 'S', score: 1 },
  '8-7': { letter: 'H', score: 4 },
  '9-7': { letter: 'E', score: 1 },
  '10-7': { letter: 'M', score: 3 },
  '11-7': { letter: 'E', score: 1 },
};

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

  const textMap: { [key: string]: string } = {
    'DL': 'Double Letter',
    'TL': 'Triple Letter',
    'DW': 'Double Word',
    'TW': 'Triple Word',
  };
  
  return (
    <div
      className={cn(
        'flex aspect-square select-none items-center justify-center rounded-sm text-xs font-semibold uppercase tracking-tighter text-center leading-none',
        'bg-[#d8cebc] border border-[#d1c6b4]',
        'transition-colors duration-150',
        'text-white/30',
        classMap[type],
        (onClick || onDrop) && !children && 'hover:bg-yellow-300/50 cursor-pointer'
      )}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {children || (type === '★' ? <Star className="h-3 w-3 sm:h-4 sm:w-4" /> : <span className="hidden sm:inline">{textMap[type]}</span>)}
    </div>
  );
}

function PlacedTileComponent({ tile, isPending, onClick }: { tile: Tile, isPending: boolean, onClick?: () => void }) {
  return (
    <div 
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-sm border-b-2 border-black/20 bg-[#f8e8c7] shadow-sm",
        isPending && "cursor-pointer ring-2 ring-yellow-400 ring-offset-1"
      )}
      onClick={onClick}
    >
      <span className="text-lg sm:text-2xl font-bold text-gray-800">{tile.letter}</span>
      <span className="absolute bottom-0 right-0.5 text-[0.5rem] sm:text-xs font-semibold text-gray-800">{tile.score}</span>
    </div>
  );
}

const GameBoard = ({ 
  placedTiles = initialPlacedTiles, 
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
  placedTiles: initialPlacedTiles,
  pendingTiles: [],
};


export default GameBoard;
