'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Suit = 'hearts' | 'spades' | 'clubs' | 'diamonds';
type SolitaireCard = {
  id: string;
  rank: number;
  suit: Suit;
};

const SUITS: Suit[] = ['hearts', 'spades', 'clubs', 'diamonds'];

function createDeck(): SolitaireCard[] {
  return [1, 2, 3, 4].flatMap((rank) =>
    SUITS.map((suit) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
    }))
  );
}

function suitSymbol(suit: Suit) {
  if (suit === 'hearts') return '♥';
  if (suit === 'diamonds') return '♦';
  if (suit === 'clubs') return '♣';
  return '♠';
}

export default function SolitaireSprintGame() {
  const [stock, setStock] = useState<SolitaireCard[]>([...createDeck()].reverse());
  const [waste, setWaste] = useState<SolitaireCard[]>([]);
  const [foundations, setFoundations] = useState<Record<Suit, number>>({
    hearts: 0,
    spades: 0,
    clubs: 0,
    diamonds: 0,
  });

  const topCard = waste[waste.length - 1] || null;
  const solved = useMemo(() => Object.values(foundations).every((value) => value === 4), [foundations]);

  const drawCard = () => {
    if (stock.length === 0) {
      setStock([...waste].reverse());
      setWaste([]);
      return;
    }
    setWaste((current) => [...current, stock[stock.length - 1]]);
    setStock((current) => current.slice(0, -1));
  };

  const moveToFoundation = () => {
    if (!topCard) return;
    const expectedRank = foundations[topCard.suit] + 1;
    if (topCard.rank !== expectedRank) {
      return;
    }
    setFoundations((current) => ({ ...current, [topCard.suit]: expectedRank }));
    setWaste((current) => current.slice(0, -1));
  };

  const reset = () => {
    setStock([...createDeck()].reverse());
    setWaste([]);
    setFoundations({ hearts: 0, spades: 0, clubs: 0, diamonds: 0 });
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,255,0.92))] shadow-[0_20px_60px_rgba(124,58,237,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Solitaire Sprint</CardTitle>
          <CardDescription>Draw through the mini deck and build each suit from Ace to 4.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">{stock.length} in stock</Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Redeal
          </Button>
          {solved && <ArcadeSessionButton modeId="solitaire" score={120} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Stock & Waste</div>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={drawCard}
                className="flex h-32 w-24 items-center justify-center rounded-[20px] border border-dashed border-violet-300 bg-violet-50 text-sm font-black text-violet-900"
              >
                Draw
              </button>
              <div className="flex h-32 w-24 items-center justify-center rounded-[20px] border border-slate-200 bg-white text-center shadow-sm">
                {topCard ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-slate-900">{topCard.rank}</div>
                    <div className="text-2xl">{suitSymbol(topCard.suit)}</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Waste</div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={moveToFoundation} disabled={!topCard}>
                Move To Foundation
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SUITS.map((suit) => (
              <div key={suit} className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-black capitalize text-slate-900">{suit}</div>
                  <div className="text-2xl">{suitSymbol(suit)}</div>
                </div>
                <div className="mt-6 flex h-28 items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 text-3xl font-black text-slate-900">
                  {foundations[suit]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
