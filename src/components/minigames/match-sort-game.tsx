'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Coffee, Croissant, CupSoda, Popcorn, Sandwich, Sparkles, SprayCan, Trash2 } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type GoodsId = 'drinks' | 'snacks' | 'clean' | 'breakfast';
type GoodsItem = {
  id: string;
  kind: GoodsId;
  tone: string;
  icon: typeof CupSoda;
  label: string;
};

const CATEGORIES: Record<GoodsId, { label: string; tone: string; icon: typeof CupSoda }> = {
  drinks: { label: 'Drinks', tone: 'from-sky-100 via-cyan-50 to-blue-100 text-sky-700', icon: CupSoda },
  snacks: { label: 'Snacks', tone: 'from-amber-100 via-orange-50 to-yellow-100 text-amber-700', icon: Popcorn },
  clean: { label: 'Clean', tone: 'from-emerald-100 via-teal-50 to-cyan-100 text-emerald-700', icon: Sparkles },
  breakfast: { label: 'Morning', tone: 'from-rose-100 via-orange-50 to-amber-100 text-rose-700', icon: Croissant },
};

const ORDER: GoodsId[] = ['drinks', 'snacks', 'clean', 'breakfast'];
const START_ITEMS: GoodsItem[] = [
  { id: 'snacks-1', kind: 'snacks', tone: 'from-amber-100 to-orange-100 text-orange-700', icon: Sandwich, label: 'Chips' },
  { id: 'drinks-1', kind: 'drinks', tone: 'from-cyan-100 to-sky-100 text-sky-700', icon: CupSoda, label: 'Juice' },
  { id: 'clean-1', kind: 'clean', tone: 'from-emerald-100 to-teal-100 text-emerald-700', icon: Trash2, label: 'Sponge' },
  { id: 'breakfast-1', kind: 'breakfast', tone: 'from-rose-100 to-orange-100 text-rose-700', icon: Croissant, label: 'Bowl' },
  { id: 'drinks-2', kind: 'drinks', tone: 'from-sky-100 to-blue-100 text-blue-700', icon: CupSoda, label: 'Soda' },
  { id: 'breakfast-2', kind: 'breakfast', tone: 'from-amber-100 to-orange-100 text-amber-700', icon: Croissant, label: 'Toast' },
  { id: 'snacks-2', kind: 'snacks', tone: 'from-yellow-100 to-amber-100 text-amber-700', icon: Popcorn, label: 'Popcorn' },
  { id: 'clean-2', kind: 'clean', tone: 'from-teal-100 to-cyan-100 text-teal-700', icon: Sparkles, label: 'Soap' },
  { id: 'breakfast-3', kind: 'breakfast', tone: 'from-orange-100 to-amber-100 text-orange-700', icon: Coffee, label: 'Tea' },
  { id: 'clean-3', kind: 'clean', tone: 'from-cyan-100 to-emerald-100 text-cyan-700', icon: SprayCan, label: 'Spray' },
  { id: 'drinks-3', kind: 'drinks', tone: 'from-indigo-100 to-sky-100 text-indigo-700', icon: CupSoda, label: 'Shake' },
  { id: 'snacks-3', kind: 'snacks', tone: 'from-orange-100 to-yellow-100 text-orange-700', icon: Sandwich, label: 'Crackers' },
];

function GoodsChip({ icon: Icon, tone, label, compact = false }: Pick<GoodsItem, 'icon' | 'tone' | 'label'> & { compact?: boolean }) {
  return (
    <span
      className={cn(
        'flex aspect-square items-center justify-center rounded-[1rem] border border-white/85 bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_16px_rgba(35,50,80,.08)]',
        tone,
        compact ? 'text-base' : 'text-lg md:text-xl'
      )}
      title={label}
      aria-label={label}
    >
      <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5 md:h-6 md:w-6')} />
    </span>
  );
}

function createBins() {
  return ORDER.reduce<Record<GoodsId, GoodsItem[]>>((bins, kind) => {
    bins[kind] = [];
    return bins;
  }, {} as Record<GoodsId, GoodsItem[]>);
}

export default function MatchSortGame() {
  const { playSfx } = useAudio();
  const [tray, setTray] = useState<GoodsItem[]>(START_ITEMS);
  const [bins, setBins] = useState<Record<GoodsId, GoodsItem[]>>(() => createBins());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const sortedCount = useMemo(() => ORDER.reduce((sum, kind) => sum + bins[kind].length, 0), [bins]);
  const solved = tray.length === 0 && ORDER.every((kind) => bins[kind].length === 3);
  const selectedItem = tray.find((item) => item.id === selectedItemId) || null;

  const reset = () => {
    playSfx('swoosh');
    setTray(START_ITEMS);
    setBins(createBins());
    setSelectedItemId(null);
    setMessage('');
    setSessionId(createArcadeSessionId());
  };

  const placeInBin = (kind: GoodsId) => {
    if (!selectedItem) {
      playSfx('arcadeError');
      setMessage('Pick item');
      return;
    }
    if (selectedItem.kind !== kind) {
      playSfx('arcadeError');
      setMessage('Wrong shelf');
      return;
    }

    playSfx('place');
    setTray((current) => current.filter((item) => item.id !== selectedItem.id));
    setBins((current) => ({
      ...current,
      [kind]: [...current[kind], selectedItem],
    }));
    setSelectedItemId(null);
    setMessage('');
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(254,252,232,0.94))] p-2 shadow-[0_24px_70px_rgba(161,98,7,0.1)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
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
                    <GoodsChip icon={category.icon} tone={category.tone} label={category.label} compact />
                  </div>
                  <div className="mt-2 grid flex-1 grid-cols-3 content-center gap-1 rounded-[0.9rem] bg-slate-50/80 p-1.5">
                    {Array.from({ length: 3 }).map((_, index) => {
                      const item = bins[kind][index];
                      return (
                        <div key={index} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/65 p-1">
                          {item ? <GoodsChip icon={item.icon} tone={item.tone} label={item.label} /> : null}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.2rem] border border-amber-100 bg-white/90 p-2">
            {message ? <div className="mb-1 text-center text-xs font-bold text-slate-600">{message}</div> : null}
            <div className="grid grid-cols-6 gap-1.5 md:grid-cols-12">
              {tray.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playSfx('arcadeSelect');
                    setSelectedItemId((current) => (current === item.id ? null : item.id));
                    setMessage('');
                  }}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-xl border bg-white p-1 shadow-sm transition-all',
                    selectedItemId === item.id ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-200'
                  )}
                >
                  <GoodsChip icon={item.icon} tone={item.tone} label={item.label} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
