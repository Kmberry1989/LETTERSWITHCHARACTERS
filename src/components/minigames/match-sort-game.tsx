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

const BASE_LAYOUT: GoodsId[][] = [
  ['soda', 'juice', 'chips', 'soap'],
  ['tea', 'cereal', 'juice', 'chips'],
  ['soap', 'tea', 'cereal', 'soda'],
  ['chips', 'soap', 'tea', 'juice'],
  ['cereal', 'soda', 'chips', 'tea'],
  [],
  [],
];

function buildShelves() {
  return BASE_LAYOUT.map((shelf, shelfIndex) =>
    shelf.map((kind, itemIndex) => ({
      id: `${kind}-${shelfIndex}-${itemIndex}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      emoji: GOODS_LOOKUP[kind].emoji,
    }))
  );
}

function isShelfComplete(shelf: Shelf) {
  return shelf.length === 4 && shelf.every((item) => item.kind === shelf[0]?.kind);
}

function canMoveItem(item: GoodsItem, destination: Shelf) {
  if (destination.length >= 4) return false;
  if (destination.length === 0) return true;
  return destination[destination.length - 1].kind === item.kind && !isShelfComplete(destination);
}

export default function MatchSortGame() {
  const [shelves, setShelves] = useState<Shelf[]>(() => buildShelves());
  const [selectedShelfIndex, setSelectedShelfIndex] = useState<number | null>(null);

  const completedShelves = useMemo(() => shelves.filter(isShelfComplete).length, [shelves]);
  const solved = completedShelves >= 5;

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
    if (!movingItem) return;

    if (!canMoveItem(movingItem, shelf)) {
      setSelectedShelfIndex(shelfIndex);
      return;
    }

    setShelves((current) => {
      const next = current.map((entry) => [...entry]);
      next[selectedShelfIndex].pop();
      next[shelfIndex].push(movingItem);
      return next;
    });
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
                  {shelf.length}/4
                </Badge>
              </div>
              <div className="flex min-h-[220px] items-end gap-2 rounded-[24px] bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(241,245,249,0.96))] p-3">
                {Array.from({ length: 4 }).map((_, slot) => {
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
