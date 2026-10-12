'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import type { Tile, PlacedTile } from '@/lib/game/types';
import { BOARD_LAYOUT } from '@/lib/game/constants';
import { ThemedTileFace } from '@/components/game/themed-tile-face';
import { useMobileGestures } from '@/components/game/mobile-gesture-context';

export const boardLayout = BOARD_LAYOUT;

type GameBoardProps = {
  placedTiles?: Record<string, Tile>;
  pendingTiles?: PlacedTile[];
  onCellClick?: (row: number, col: number) => void;
  onDrop?: (row: number, col: number, tileIndex?: number | null) => void;
  onPendingTileSelect?: (tile: PlacedTile) => void;
  onPendingTileMove?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  onPendingTileReturn?: (row: number, col: number) => void;
  tileSetId?: string | null;
  ownerTileSetIds?: Record<string, string | null | undefined>;
  selectedPendingTileKey?: string | null;
};

type BoardTouchDrag = {
  tile: Tile;
  fromRow: number;
  fromCol: number;
  x: number;
  y: number;
};

function Cell({
  type,
  children,
  onClick,
  onDrop,
  onDragOver,
  row,
  col,
  isPlaceable,
}: {
  type: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  row: number;
  col: number;
  isPlaceable: boolean;
}) {
  const classMap: { [key: string]: string } = {
    DL: 'board-cell-dl',
    TL: 'board-cell-tl',
    DW: 'board-cell-dw',
    TW: 'board-cell-tw',
    '★': 'board-cell-start',
  };

  const canInteract = !!(onClick || onDrop);
  const isMultiplier = type === 'DL' || type === 'TL' || type === 'DW' || type === 'TW';
  const multiplierLabel = {
    DL: { value: '2×', target: 'LETTER', accessible: 'Double letter' },
    TL: { value: '3×', target: 'LETTER', accessible: 'Triple letter' },
    DW: { value: '2×', target: 'WORD', accessible: 'Double word' },
    TW: { value: '3×', target: 'WORD', accessible: 'Triple word' },
  }[type];

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
      data-board-cell="true"
      data-board-row={row}
      data-board-col={col}
      data-board-cell-placeable={isPlaceable ? 'true' : 'false'}
      data-board-bonus={isMultiplier ? type : type === '★' ? 'START' : undefined}
      aria-label={!children && multiplierLabel ? `${multiplierLabel.accessible} bonus square, row ${row + 1}, column ${col + 1}` : undefined}
      onClick={canInteract ? onClick : undefined}
      onDrop={canInteract ? onDrop : undefined}
      onDragOver={canInteract ? onDragOver : undefined}
    >
      {children ||
        (type === '★' ? (
          <div className="flex items-center justify-center">
            <Star
              className="h-3.5 w-3.5 fill-current min-[420px]:h-4.5 min-[420px]:w-4.5 sm:h-6 sm:w-6"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.35))' }}
            />
          </div>
        ) : isMultiplier ? (
          <div className="relative z-10 flex flex-col items-center justify-center leading-[0.78]" aria-hidden="true">
            <span className="text-[0.48rem] font-black min-[420px]:text-[0.62rem] sm:text-[0.78rem] md:text-[0.86rem]" style={{ textShadow: 'var(--board-cell-text-shadow)' }}>
              {multiplierLabel?.value}
            </span>
            <span className="hidden text-[0.3rem] font-black tracking-[0.08em] min-[420px]:block min-[420px]:text-[0.36rem] sm:text-[0.46rem] md:text-[0.5rem]">
              {multiplierLabel?.target}
            </span>
          </div>
        ) : null)}
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
  onTouchDragStart,
  row,
  col,
}: {
  tile: Tile;
  isPending: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isSelected?: boolean;
  tileSetId?: string | null;
  ownerTileSetIds?: Record<string, string | null | undefined>;
  onTouchDragStart?: (tile: Tile, row: number, col: number, x: number, y: number) => void;
  row?: number;
  col?: number;
}) {
  const canInteract = !!onClick;
  const touchRef = React.useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);

  const handleTouchDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || !isPending || !onTouchDragStart || row === undefined || col === undefined) return;
    touchRef.current = { startX: e.clientX, startY: e.clientY, dragging: false };
  };
  const handleTouchMove = (e: React.PointerEvent) => {
    const t = touchRef.current;
    if (!t || t.dragging) return;
    if (Math.hypot(e.clientX - t.startX, e.clientY - t.startY) > 10) {
      t.dragging = true;
      onTouchDragStart!(tile, row!, col!, e.clientX, e.clientY);
    }
  };
  const handleTouchUp = () => { touchRef.current = null; };
  const resolvedTileSetId =
    tile.tileSetId || (tile.ownerUid ? ownerTileSetIds?.[tile.ownerUid] : undefined) || tileSetId;

  return (
    <motion.div
      layout
      initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ scale: canInteract ? 1.03 : 1 }}
      draggable={isPending}
      onDragStartCapture={onDragStart}
      className={cn(
        'relative flex h-full w-full items-center justify-center rounded-[0.2rem] border-b-2 border-black/20 bg-[#f8e8c7] shadow-[0_10px_18px_rgba(0,0,0,0.16)] sm:rounded-sm',
        isPending && canInteract && 'cursor-pointer ring-2 ring-yellow-400 ring-offset-1',
        isPending && !canInteract && 'ring-2 ring-yellow-400/50 ring-offset-1',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'before:absolute before:inset-0 before:rounded-[0.2rem] before:bg-gradient-to-br before:from-white/55 before:via-transparent before:to-transparent sm:before:rounded-sm',
      )}
      onClick={onClick}
      onPointerDown={handleTouchDown}
      onPointerMove={handleTouchMove}
      onPointerUp={handleTouchUp}
      onPointerCancel={handleTouchUp}
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
  onPendingTileMove,
  onPendingTileReturn,
  tileSetId,
  ownerTileSetIds,
  selectedPendingTileKey,
}: GameBoardProps) => {
  const [boardTouchDrag, setBoardTouchDrag] = React.useState<BoardTouchDrag | null>(null);
  const boardDragRef = React.useRef<BoardTouchDrag | null>(null);

  const startBoardTouchDrag = React.useCallback((tile: Tile, fromRow: number, fromCol: number, x: number, y: number) => {
    const drag = { tile, fromRow, fromCol, x, y };
    boardDragRef.current = drag;
    setBoardTouchDrag(drag);
  }, []);

  // Track drag position and handle drop
  React.useEffect(() => {
    if (!boardTouchDrag) return;
    const handleMove = (e: PointerEvent) => {
      const d = boardDragRef.current;
      if (!d) return;
      const next = { ...d, x: e.clientX, y: e.clientY };
      boardDragRef.current = next;
      setBoardTouchDrag(next);
    };
    const handleUp = (e: PointerEvent) => {
      const d = boardDragRef.current;
      boardDragRef.current = null;
      setBoardTouchDrag(null);
      if (!d) return;
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      // Dropped on rack? Return the tile.
      const rack = target?.closest('[data-rack-interactive="true"]');
      if (rack && onPendingTileReturn) {
        onPendingTileReturn(d.fromRow, d.fromCol);
        return;
      }
      // Dropped on a board cell? Move there.
      const cell = target?.closest<HTMLElement>('[data-board-cell-placeable="true"]');
      if (cell) {
        const toRow = Number(cell.dataset.boardRow);
        const toCol = Number(cell.dataset.boardCol);
        if (!Number.isNaN(toRow) && !Number.isNaN(toCol) && (toRow !== d.fromRow || toCol !== d.fromCol)) {
          if (onPendingTileMove) onPendingTileMove(d.fromRow, d.fromCol, toRow, toCol);
          else onCellClick?.(toRow, toCol);
        }
      }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [boardTouchDrag, onPendingTileMove, onPendingTileReturn, onCellClick]);
  const { shouldSuppressBoardTap } = useMobileGestures();
  const allTiles = { ...placedTiles };
  const pendingKeys = new Set<string>();

  pendingTiles.forEach((tile) => {
    const key = `${tile.row}-${tile.col}`;
    allTiles[key] = tile;
    pendingKeys.add(key);
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const runBoardTap = (handler?: () => void) => {
    if (!handler || shouldSuppressBoardTap()) {
      return;
    }
    handler();
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
      <div className="grid grid-cols-15 gap-px rounded-[0.4rem] [background:var(--board-grid-bg)] p-[0.22rem] shadow-inner min-[420px]:gap-0.5 sm:gap-1 sm:rounded-[0.9rem] sm:p-2 md:gap-[0.3rem] md:p-2.5">
        {boardLayout.map((row, rowIndex) =>
          row.map((cellType, colIndex) => {
            const tileKey = `${rowIndex}-${colIndex}`;
            const tile = allTiles[tileKey];
            const isPending = pendingKeys.has(tileKey);
            const canPlace = Boolean((onCellClick || onDrop) && !tile);

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                type={cellType}
                row={rowIndex}
                col={colIndex}
                isPlaceable={canPlace}
                onClick={canPlace && onCellClick ? () => runBoardTap(() => onCellClick(rowIndex, colIndex)) : undefined}
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
                    row={rowIndex}
                    col={colIndex}
                    onTouchDragStart={startBoardTouchDrag}
                    onClick={
                      isPending && onPendingTileSelect
                        ? () => runBoardTap(() => onPendingTileSelect({ ...tile, row: rowIndex, col: colIndex }))
                        : undefined
                    }
                    onDragStart={
                      isPending
                        ? (e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('application/x-pending-tile', `${rowIndex}-${colIndex}`);
                          }
                        : undefined
                    }
                  />
                )}
              </Cell>
            );
          }),
        )}
      </div>
    </div>
      {boardTouchDrag ? (
        <div className="pointer-events-none fixed inset-0 z-[70]">
          <div
            className="absolute h-[3rem] w-[3rem] -translate-x-1/2 -translate-y-1/2 rotate-3 opacity-95"
            style={{ left: boardTouchDrag.x, top: boardTouchDrag.y }}
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-[0.2rem] border-b-2 border-black/20 bg-[#f8e8c7] shadow-[0_16px_26px_rgba(15,23,42,0.28)]">
              <ThemedTileFace
                tileSetId={tileSetId}
                letter={boardTouchDrag.tile.letter}
                score={boardTouchDrag.tile.score}
                isBlank={boardTouchDrag.tile.isBlank}
                showScore
              />
            </div>
          </div>
        </div>
      ) : null}
  );
};

export default GameBoard;
