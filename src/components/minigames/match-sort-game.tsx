'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type GoodsId = 'drinks' | 'snacks' | 'clean' | 'breakfast';
type GoodsItem = {
  id: string;
  kind: GoodsId;
  emoji: string;
};

const CATEGORIES: Record<GoodsId, { label: string; emoji: string; items: string[] }> = {
  drinks: { label: 'Drinks', emoji: '🥤', items: ['🥤', '🧃', '🧋'] },
  snacks: { label: 'Snacks', emoji: '🍿', items: ['🍿', '🍟', '🥨'] },
  clean: { label: 'Clean', emoji: '🧼', items: ['🧼', '🧽', '🧴'] },
  breakfast: { label: 'Morning', emoji: '🥣', items: ['🥣', '🍞', '🍵'] },
};

const ORDER: GoodsId[] = ['drinks', 'snacks', 'clean', 'breakfast'];
const START_ITEMS: GoodsItem[] = [
  { id: 'snacks-1', kind: 'snacks', emoji: '🍟' },
  { id: 'drinks-1', kind: 'drinks', emoji: '🧃' },
  { id: 'clean-1', kind: 'clean', emoji: '🧽' },
  { id: 'breakfast-1', kind: 'breakfast', emoji: '🥣' },
  { id: 'drinks-2', kind: 'drinks', emoji: '🥤' },
  { id: 'breakfast-2', kind: 'breakfast', emoji: '🍞' },
  { id: 'snacks-2', kind: 'snacks', emoji: '🍿' },
  { id: 'clean-2', kind: 'clean', emoji: '🧼' },
  { id: 'breakfast-3', kind: 'breakfast', emoji: '🍵' },
  { id: 'clean-3', kind: 'clean', emoji: '🧴' },
  { id: 'drinks-3', kind: 'drinks', emoji: '🧋' },
  { id: 'snacks-3', kind: 'snacks', emoji: '🥨' },
];

function createBins() {
  return ORDER.reduce<Record<GoodsId, GoodsItem[]>>((bins, kind) => {
    bins[kind] = [];
    return bins;
  }, {} as Record<GoodsId, GoodsItem[]>);
}

export default function MatchSortGame() {
  const [tray, setTray] = useState<GoodsItem[]>(START_ITEMS);
  const [bins, setBins] = useState<Record<GoodsId, GoodsItem[]>>(() => createBins());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [message, setMessage] = useState('Tap an item, then its shelf.');
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const sortedCount = useMemo(() => ORDER.reduce((sum, kind) => sum + bins[kind].length, 0), [bins]);
  const solved = sortedCount === START_ITEMS.length;
  const selectedItem = tray.find((item) => item.id === selectedItemId) || null;

  const reset = () => {
    setTray(START_ITEMS);
    setBins(createBins());
    setSelectedItemId(null);
    setMessage('Tap an item, then its shelf.');
    setSessionId(createArcadeSessionId());
  };

  const placeInBin = (kind: GoodsId) => {
    if (!selectedItem) {
      setMessage('Choose an item first.');
      return;
    }
    if (selectedItem.kind !== kind) {
      setMessage(`${selectedItem.emoji} belongs somewhere else.`);
      return;
    }

    setTray((current) => current.filter((item) => item.id !== selectedItem.id));
    setBins((current) => ({
      ...current,
      [kind]: [...current[kind], selectedItem],
    }));
    setSelectedItemId(null);
    setMessage('Good sort.');
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(254,252,232,0.94))] p-2 shadow-[0_24px_70px_rgba(161,98,7,0.1)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <h1 className="hidden font-headline text-3xl font-black md:block">Goods Sort</h1>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {sortedCount}/{START_ITEMS.length}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={reset} aria-label="Restock">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Restock</span>
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="match-sort" score={260} /> : null}
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-2 md:gap-4">
          <div className="grid min-h-0 grid-cols-2 gap-2 md:grid-cols-4">
            {ORDER.map((kind) => {
              const category = CATEGORIES[kind];
              const canReceive = selectedItem?.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => placeInBin(kind)}
                  className={cn(
                    'flex min-h-0 flex-col rounded-[1.2rem] border bg-white/85 p-2 text-left shadow-sm transition-all',
                    canReceive ? 'border-emerald-300 ring-4 ring-emerald-100' : 'border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 md:text-sm">{category.label}</div>
                    <div className="text-lg">{category.emoji}</div>
                  </div>
                  <div className="mt-2 grid flex-1 grid-cols-3 content-center gap-1 rounded-[0.9rem] bg-slate-50/80 p-1.5">
                    {Array.from({ length: 3 }).map((_, index) => {
                      const item = bins[kind][index];
                      return (
                        <div key={index} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/65 text-2xl md:text-3xl">
                          {item?.emoji}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.2rem] border border-amber-100 bg-white/90 p-2">
            <div className="mb-1 text-center text-xs font-bold text-slate-600">{solved ? 'All shelves stocked.' : message}</div>
            <div className="grid grid-cols-6 gap-1.5 md:grid-cols-12">
              {tray.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItemId((current) => (current === item.id ? null : item.id));
                    setMessage(`${item.emoji} selected.`);
                  }}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-xl border bg-white text-2xl shadow-sm transition-all md:text-3xl',
                    selectedItemId === item.id ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-200'
                  )}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
