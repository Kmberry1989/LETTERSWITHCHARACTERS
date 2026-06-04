'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Item = {
  id: string;
  emoji: string;
  label: string;
  group: 'Fruit' | 'Travel' | 'Weather';
};

const ITEMS: Item[] = [
  { id: 'apple', emoji: '🍎', label: 'Apple', group: 'Fruit' },
  { id: 'banana', emoji: '🍌', label: 'Banana', group: 'Fruit' },
  { id: 'plane', emoji: '✈️', label: 'Plane', group: 'Travel' },
  { id: 'map', emoji: '🗺️', label: 'Map', group: 'Travel' },
  { id: 'sun', emoji: '☀️', label: 'Sun', group: 'Weather' },
  { id: 'rain', emoji: '🌧️', label: 'Rain', group: 'Weather' },
];

const GROUPS: Item['group'][] = ['Fruit', 'Travel', 'Weather'];

export default function MatchSortGame() {
  const [remaining, setRemaining] = useState(ITEMS);
  const [sorted, setSorted] = useState<Record<Item['group'], Item[]>>({
    Fruit: [],
    Travel: [],
    Weather: [],
  });
  const [status, setStatus] = useState('Tap an item, then place it into the matching category bin.');
  const solved = remaining.length === 0;

  const moveItem = (item: Item, group: Item['group']) => {
    if (item.group !== group) {
      setStatus(`${item.label} does not belong in ${group}.`);
      return;
    }

    setRemaining((current) => current.filter((entry) => entry.id !== item.id));
    setSorted((current) => ({ ...current, [group]: [...current[group], item] }));
    setSelectedId(null);
    setStatus(`${item.label} sorted into ${group}.`);
  };

  const reset = () => {
    setRemaining(ITEMS);
    setSorted({ Fruit: [], Travel: [], Weather: [] });
    setSelectedId(null);
    setStatus('Fresh mix. Tap an item, then place it into the matching category bin.');
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = useMemo(() => remaining.find((item) => item.id === selectedId) || null, [remaining, selectedId]);

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.94))] shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Match & Sort</CardTitle>
          <CardDescription>Choose an item and file it into the right bucket. Clear the tray to finish.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">{remaining.length} items left</Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved && <ArcadeSessionButton modeId="match-sort" score={100} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Loose Tray</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {remaining.map((item) => {
              const active = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    active ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5'
                  }`}
                >
                  <div className="text-2xl">{item.emoji}</div>
                  <div className="mt-2 font-black text-slate-900">{item.label}</div>
                </button>
              );
            })}
            {remaining.length === 0 && <div className="text-sm text-slate-500">Tray is empty.</div>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group} className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-black text-slate-900">{group}</div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!selectedItem}
                  onClick={() => selectedItem && moveItem(selectedItem, group)}
                >
                  Drop Here
                </Button>
              </div>
              <div className="mt-3 flex min-h-24 flex-wrap gap-2">
                {sorted[group].map((item) => (
                  <Badge key={item.id} variant="outline" className="rounded-full px-3 py-1.5 text-sm">
                    {item.emoji} {item.label}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">{status}</div>
      </CardContent>
    </Card>
  );
}
