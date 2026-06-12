'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GoodsId = 'soda' | 'cereal' | 'chips' | 'soap' | 'juice' | 'tea';
type GoodsItem = {
  id: string;
  kind: GoodsId;
  emoji: string;
};
type Shelf = GoodsItem[];

const GOODS_LOOKUP: Record<GoodsId, { emoji: string }> = {
  soda: { emoji: '🥤' },
  cereal: { emoji: '🥣' },
  chips: { emoji: '🍟' },
  soap: { emoji: '🧼' },
  juice: { emoji: '🧃' },
  tea: { emoji: '🍵' },
};

const GOODS_ORDER: GoodsId[] = ['soda', 'cereal', 'chips', 'soap', 'juice', 'tea'];
const SHELF_CAPACITY = 4;
const EMPTY_SHELVES = 2;
const SCRAMBLE_MOVES = 72;

function createItem(kind: GoodsId, shelfIndex: number, itemIndex: number): GoodsItem {
  return {
    id: `${kind}-${shelfIndex}-${itemIndex}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    emoji: GOODS_LOOKUP[kind].emoji,
  };
}

function buildSolvedShelves() {
  const groupedShelves = GOODS_ORDER.map((kind, shelfIndex) =>
    Array.from({ length: SHELF_CAPACITY }, (_, itemIndex) => createItem(kind, shelfIndex, itemIndex)),
  );
  return [...groupedShelves, ...Array.from({ length: EMPTY_SHELVES }, () => [])];
}

function isShelfComplete(shelf: Shelf) {
  return shelf.length === SHELF_CAPACITY && shelf.every((item) => item.kind === shelf[0]?.kind);
}

function canMoveItem(item: GoodsItem, destination: Shelf) {
  if (destination.length >= SHELF_CAPACITY) return false;
  if (destination.length === 0) return true;
  return destination[destination.length - 1].kind === item.kind && !isShelfComplete(destination);
}

function listLegalMoves(shelves: Shelf[]) {
  const moves: Array<{ from: number; to: number }> = [];

  shelves.forEach((source, fromIndex) => {
    const movingItem = source[source.length - 1];
    if (!movingItem || isShelfComplete(source)) {
      return;
    }

    shelves.forEach((destination, toIndex) => {
      if (fromIndex === toIndex) return;
      if (canMoveItem(movingItem, destination)) {
        moves.push({ from: fromIndex, to: toIndex });
      }
    });
  });

  return moves;
}

function applyMove(shelves: Shelf[], from: number, to: number) {
  const next = shelves.map((entry) => [...entry]);
  const movingItem = next[from].pop();
  if (!movingItem) {
    return next;
  }
  next[to].push(movingItem);
  return next;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildShelves() {
  let shelves = buildSolvedShelves();

  for (let moveIndex = 0; moveIndex < SCRAMBLE_MOVES; moveIndex += 1) {
    const legalMoves = listLegalMoves(shelves);
    if (legalMoves.length === 0) {
      break;
    }
    const move = randomItem(legalMoves);
    shelves = applyMove(shelves, move.from, move.to);
  }

  return shelves;
}

export default function MatchSortGame() {
  const [shelves, setShelves] = useState<Shelf[]>(() => buildShelves());
  const [selectedShelfIndex, setSelectedShelfIndex] = useState<number | null>(null);

  const completedShelves = useMemo(() => shelves.filter(isShelfComplete).length, [shelves]);
  const solved = completedShelves >= GOODS_ORDER.length;

  const handleShelfClick = (shelfIndex: number) => {
    const shelf = shelves[shelfIndex];

    if (selectedShelfIndex === null) {
      if (shelf.length === 0 || isShelfComplete(shelf)) return;
      setSelectedShelfIndex(shelfIndex);
      return;
    }

    if (selectedShelfIndex === shelfIndex) {
      setSelectedShelfIndex(null);
      return;
    }

    const source = shelves[selectedShelfIndex];
    const movingItem = source[source.length - 1];
    if (!movingItem) {
      setSelectedShelfIndex(null);
      return;
    }

    if (!canMoveItem(movingItem, shelf)) {
      if (shelf.length === 0 || isShelfComplete(shelf)) {
        setSelectedShelfIndex(null);
      } else {
        setSelectedShelfIndex(shelfIndex);
      }
      return;
    }

    setShelves((current) => applyMove(current, selectedShelfIndex, shelfIndex));
    setSelectedShelfIndex(null);
  };

  const reset = () => {
    setShelves(buildShelves());
    setSelectedShelfIndex(null);
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(254,252,232,0.94))] shadow-[0_24px_70px_rgba(161,98,7,0.1)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CardTitle className="font-headline text-3xl">Goods Sort</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {completedShelves} shelves complete
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Restock
          </Button>
          {solved ? <ArcadeSessionButton modeId="match-sort" score={200 + completedShelves * 20} label="Bank this clear" /> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shelves.map((shelf, shelfIndex) => {
          const selected = selectedShelfIndex === shelfIndex;
          const complete = isShelfComplete(shelf);
          return (
            <button
              key={shelfIndex}
              type="button"
              onClick={() => handleShelfClick(shelfIndex)}
              className={`rounded-[30px] border bg-white/85 p-4 shadow-sm transition-all ${
                complete
                  ? 'border-emerald-300 ring-4 ring-emerald-100'
                  : selected
                    ? 'border-amber-400 ring-4 ring-amber-100'
                    : 'border-slate-200 hover:-translate-y-1'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Shelf {shelfIndex + 1}</div>
                <Badge variant={complete ? 'default' : 'outline'} className="rounded-full px-3 py-1">
                  {shelf.length}/{SHELF_CAPACITY}
                </Badge>
              </div>
              <div className="flex min-h-[220px] items-end gap-2 rounded-[24px] bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(241,245,249,0.96))] p-3">
                {Array.from({ length: SHELF_CAPACITY }).map((_, slot) => {
                  const item = shelf[slot];
                  return (
                    <div
                      key={`${shelfIndex}-${slot}`}
                      className={`flex h-44 flex-1 items-center justify-center rounded-2xl border ${
                        item ? 'border-slate-200 bg-white shadow-sm' : 'border-dashed border-slate-200 bg-white/40'
                      }`}
                    >
                      {item ? <div className="text-4xl sm:text-5xl">{item.emoji}</div> : null}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
