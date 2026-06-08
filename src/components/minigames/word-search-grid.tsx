'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Cell = { row: number; col: number };
type Placement = {
  word: string;
  startRow: number;
  startCol: number;
  rowStep: number;
  colStep: number;
  cells: Cell[];
};
type Puzzle = {
  grid: string[][];
  words: string[];
  placements: Placement[];
  size: number;
};
type DragState = {
  start: Cell;
  currentPoint: { x: number; y: number };
  direction: { row: number; col: number } | null;
  cells: Cell[];
};
type ResolutionState = {
  key: string;
  cells: Cell[];
  success: boolean;
};

function cellKey(cell: Cell) {
  return `${cell.row}-${cell.col}`;
}

function sequenceKey(cells: Cell[]) {
  return cells.map(cellKey).join('|');
}

function directionFromDelta(deltaRow: number, deltaCol: number) {
  if (deltaRow === 0 && deltaCol === 0) return null;

  const angle = Math.atan2(deltaRow, deltaCol);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const row = Math.round(Math.sin(snapped));
  const col = Math.round(Math.cos(snapped));

  return { row, col };
}

function traceCells(start: Cell, end: Cell, size: number) {
  const direction = directionFromDelta(end.row - start.row, end.col - start.col);
  if (!direction) {
    return { direction: null, cells: [start] };
  }

  const rowDistance = Math.abs(end.row - start.row);
  const colDistance = Math.abs(end.col - start.col);
  const steps =
    direction.row !== 0 && direction.col !== 0
      ? Math.min(rowDistance, colDistance)
      : direction.row !== 0
        ? rowDistance
        : colDistance;
  const cells: Cell[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const row = start.row + direction.row * step;
    const col = start.col + direction.col * step;
    if (row < 0 || col < 0 || row >= size || col >= size) {
      break;
    }
    cells.push({ row, col });
  }

  return { direction, cells };
}

function getWordFromCells(cells: Cell[], grid: string[][]) {
  return cells.map(({ row, col }) => grid[row][col]).join('');
}

function getCellCenter(cell: Cell, cellSize: number) {
  return {
    x: cell.col * cellSize + cellSize / 2,
    y: cell.row * cellSize + cellSize / 2,
  };
}

function getStartEdgePoint(start: Cell, next: Cell | undefined, cellSize: number) {
  const center = getCellCenter(start, cellSize);
  if (!next) {
    return center;
  }
  const deltaX = next.col - start.col;
  const deltaY = next.row - start.row;
  const magnitude = Math.hypot(deltaX, deltaY) || 1;
  const radius = cellSize * 0.42;

  return {
    x: center.x - (deltaX / magnitude) * radius,
    y: center.y - (deltaY / magnitude) * radius,
  };
}

function getSelectionFromPointer(
  event: PointerEvent | React.PointerEvent,
  rect: DOMRect,
  size: number,
  start: Cell,
) {
  const cellSize = rect.width / size;
  const col = Math.max(0, Math.min(size - 1, Math.floor((event.clientX - rect.left) / cellSize)));
  const row = Math.max(0, Math.min(size - 1, Math.floor((event.clientY - rect.top) / cellSize)));
  return traceCells(start, { row, col }, size);
}

export default function WordSearchGrid() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [resolution, setResolution] = useState<ResolutionState | null>(null);

  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);

  const placementByKey = useMemo(() => {
    const map = new Map<string, Placement>();
    for (const placement of puzzle?.placements || []) {
      map.set(sequenceKey(placement.cells), placement);
      map.set(sequenceKey([...placement.cells].reverse()), placement);
    }
    return map;
  }, [puzzle]);

  const loadPuzzle = async () => {
    setLoading(true);
    setFoundWords([]);
    setResolution(null);
    setDrag(null);

    try {
      const response = await fetch('/api/arcade/word-search', { cache: 'no-store' });
      const nextPuzzle = await response.json();
      setPuzzle(nextPuzzle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPuzzle();
  }, []);

  useEffect(() => {
    if (!drag || !puzzle) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const traced = getSelectionFromPointer(event, rect, puzzle.size, drag.start);
      setDrag((current) =>
        current
          ? {
              ...current,
              currentPoint: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              },
              direction: traced.direction,
              cells: traced.cells,
            }
          : current
      );
    };

    const handlePointerUp = () => {
      const current = drag;
      setDrag(null);
      if (current.cells.length < 2) return;

      const placement = placementByKey.get(sequenceKey(current.cells));
      if (placement && !foundSet.has(placement.word)) {
        setFoundWords((value) => [...value, placement.word]);
        setResolution({
          key: `${Date.now()}-success`,
          cells: placement.cells,
          success: true,
        });
        window.setTimeout(() => setResolution(null), 850);
        return;
      }

      setResolution({
        key: `${Date.now()}-error`,
        cells: current.cells,
        success: false,
      });
      window.setTimeout(() => setResolution(null), 520);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [drag, foundSet, placementByKey, puzzle]);

  const handlePointerDown = (cell: Cell, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!puzzle) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    setResolution(null);
    setDrag({
      start: cell,
      currentPoint: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
      direction: null,
      cells: [cell],
    });
  };

  if (loading || !puzzle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Search</CardTitle>
        </CardHeader>
        <CardContent className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
      </Card>
    );
  }

  const boardSize = 420;
  const cellSize = boardSize / puzzle.size;
  const allFound = foundWords.length === puzzle.words.length;
  const activePoints = drag?.cells.map((cell) => getCellCenter(cell, cellSize)) || [];
  const startPoint = drag
    ? getStartEdgePoint(drag.cells[0], drag.cells[1], cellSize)
    : null;

  return (
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94))] shadow-[0_20px_55px_rgba(14,165,233,0.08)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="font-headline text-3xl">Word Search</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {foundWords.length}/{puzzle.words.length}
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={() => void loadPuzzle()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Grid
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[auto,220px]">
        <div className="mx-auto">
          <div
            ref={boardRef}
            className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-white p-3 shadow-inner"
            style={{ width: boardSize + 24 }}
          >
            <div
              className="relative grid gap-1 rounded-[20px] bg-sky-50/70 p-1"
              style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
            >
              {puzzle.grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const isActive = drag?.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex);
                  const isFound = puzzle.placements.some(
                    (placement) =>
                      foundSet.has(placement.word) &&
                      placement.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex)
                  );

                  return (
                    <button
                      key={key}
                      type="button"
                      onPointerDown={(event) => handlePointerDown({ row: rowIndex, col: colIndex }, event)}
                      className={cn(
                        'relative z-10 flex aspect-square h-10 w-10 select-none items-center justify-center rounded-2xl border text-base font-black tracking-[0.08em] transition-all',
                        isActive
                          ? 'border-sky-300 bg-sky-100 text-slate-950'
                          : isFound
                            ? 'border-emerald-200 bg-emerald-50 text-slate-950'
                            : 'border-white bg-white text-slate-900 shadow-sm'
                      )}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
              <svg
                className="pointer-events-none absolute inset-1 z-20"
                viewBox={`0 0 ${boardSize} ${boardSize}`}
                preserveAspectRatio="none"
              >
                {puzzle.placements
                  .filter((placement) => foundSet.has(placement.word))
                  .map((placement) => {
                    const points = placement.cells.map((cell) => getCellCenter(cell, cellSize));
                    const first = getStartEdgePoint(placement.cells[0], placement.cells[1], cellSize);
                    const lastCell = placement.cells[placement.cells.length - 1];
                    const beforeLastCell = placement.cells[placement.cells.length - 2] || lastCell;
                    const lastCenter = getCellCenter(lastCell, cellSize);
                    const lastDirection = {
                      x: lastCell.col - beforeLastCell.col,
                      y: lastCell.row - beforeLastCell.row,
                    };
                    const magnitude = Math.hypot(lastDirection.x, lastDirection.y) || 1;
                    const lineEnd = {
                      x: lastCenter.x + (lastDirection.x / magnitude) * cellSize * 0.42,
                      y: lastCenter.y + (lastDirection.y / magnitude) * cellSize * 0.42,
                    };
                    const width = Math.max(cellSize * placement.cells.length * 0.94, cellSize * 1.6);
                    const height = cellSize * 0.92;
                    const center = {
                      x: (first.x + lineEnd.x) / 2,
                      y: (first.y + lineEnd.y) / 2,
                    };
                    const angle = Math.atan2(lineEnd.y - first.y, lineEnd.x - first.x) * (180 / Math.PI);

                    return (
                      <g key={placement.word}>
                        <line
                          x1={first.x}
                          y1={first.y}
                          x2={lineEnd.x}
                          y2={lineEnd.y}
                          stroke="#22C55E"
                          strokeWidth={cellSize * 0.34}
                          strokeLinecap="round"
                          opacity="0.18"
                        />
                        <ellipse
                          cx={center.x}
                          cy={center.y}
                          rx={width / 2}
                          ry={height / 2}
                          transform={`rotate(${angle} ${center.x} ${center.y})`}
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="4"
                        />
                      </g>
                    );
                  })}

                {drag && startPoint ? (
                  <polyline
                    points={[startPoint, ...activePoints, drag.currentPoint].map((point) => `${point.x},${point.y}`).join(' ')}
                    fill="none"
                    stroke="#0EA5E9"
                    strokeWidth={cellSize * 0.24}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {resolution ? (
                  <motion.line
                    key={resolution.key}
                    x1={getStartEdgePoint(resolution.cells[0], resolution.cells[1], cellSize).x}
                    y1={getStartEdgePoint(resolution.cells[0], resolution.cells[1], cellSize).y}
                    x2={getStartEdgePoint(
                      resolution.cells[resolution.cells.length - 1],
                      resolution.cells[resolution.cells.length - 2],
                      cellSize
                    ).x}
                    y2={getStartEdgePoint(
                      resolution.cells[resolution.cells.length - 1],
                      resolution.cells[resolution.cells.length - 2],
                      cellSize
                    ).y}
                    stroke={resolution.success ? '#22C55E' : '#EF4444'}
                    strokeWidth={cellSize * 0.3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.9 }}
                    animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: resolution.success ? 0.8 : 0.45, ease: 'easeOut' }}
                  />
                ) : null}
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {puzzle.words.map((word) => (
            <div
              key={word}
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm font-black tracking-[0.18em]',
                foundSet.has(word)
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white/75 text-slate-600'
              )}
            >
              {word}
            </div>
          ))}
          {allFound ? (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center font-black tracking-[0.18em] text-emerald-700">
                GRID CLEARED
              </div>
              <ArcadeSessionButton modeId="word-search" score={80} label="Bank this grid" />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
