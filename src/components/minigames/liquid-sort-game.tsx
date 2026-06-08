'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, RotateCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TubeColor = 'rose' | 'sky' | 'amber' | 'emerald';
type Tube = TubeColor[];

const INITIAL_TUBES: Tube[] = [
  ['rose', 'sky', 'amber', 'rose'],
  ['emerald', 'amber', 'sky', 'emerald'],
  ['amber', 'rose', 'emerald', 'sky'],
  ['sky', 'emerald', 'rose', 'amber'],
  [],
  [],
];

const COLOR_CLASS: Record<TubeColor, string> = {
  rose: 'from-rose-400 to-pink-500',
  sky: 'from-sky-400 to-cyan-500',
  amber: 'from-amber-300 to-orange-500',
  emerald: 'from-emerald-400 to-teal-500',
};

function canPour(from: Tube, to: Tube) {
  if (from.length === 0 || to.length === 4) return false;
  if (to.length === 0) return true;
  return from[from.length - 1] === to[to.length - 1];
}

function isSolved(tubes: Tube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === 4 && new Set(tube).size === 1));
}

export default function LiquidSortGame() {
  const [tubes, setTubes] = useState<Tube[]>(INITIAL_TUBES);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [pourState, setPourState] = useState<{
    fromIndex: number;
    toIndex: number;
    color: TubeColor;
  } | null>(null);
  const solved = useMemo(() => isSolved(tubes), [tubes]);

  const handleTubeClick = (index: number) => {
    if (pourState) return;

    if (selectedTube === null) {
      if (tubes[index].length > 0) setSelectedTube(index);
      return;
    }

    if (selectedTube === index) {
      setSelectedTube(null);
      return;
    }

    const fromIndex = selectedTube;
    const from = tubes[fromIndex];
    const to = tubes[index];
    if (!canPour(from, to)) {
      setSelectedTube(index);
      return;
    }

    const color = from[from.length - 1];
    setSelectedTube(null);
    setPourState({ fromIndex, toIndex: index, color });

    window.setTimeout(() => {
      setTubes((current) => {
        const next = current.map((tube) => [...tube]);
        next[index].push(next[fromIndex].pop() as TubeColor);
        return next;
      });
      setMoves((value) => value + 1);
    }, 420);

    window.setTimeout(() => {
      setPourState(null);
    }, 940);
  };

  const reset = () => {
    setTubes(INITIAL_TUBES.map((tube) => [...tube]));
    setSelectedTube(null);
    setPourState(null);
    setMoves(0);
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] shadow-[0_20px_60px_rgba(14,116,144,0.14)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Liquid Sort</CardTitle>
          <CardDescription>Tap a bottle, then another. The pour now tilts, streams, settles, and lands.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Moves {moves}
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved && <ArcadeSessionButton modeId="liquid-sort" score={Math.max(40, 100 - moves * 3)} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {tubes.map((tube, index) => {
            const selected = selectedTube === index;
            const pouringFrom = pourState?.fromIndex === index;
            const pouringTo = pourState?.toIndex === index;

            return (
              <div key={index} className="relative mx-auto">
                {pourState && (pouringFrom || pouringTo) ? (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.2 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    className={`pointer-events-none absolute ${pouringFrom ? 'left-[76px] top-8 origin-left' : 'right-[76px] top-8 origin-right'} z-20 h-3 w-20 rounded-full bg-gradient-to-r ${COLOR_CLASS[pourState.color]} shadow-[0_0_24px_rgba(56,189,248,0.35)]`}
                    style={{ rotate: pouringFrom ? 18 : -18 }}
                  />
                ) : null}

                <motion.button
                  type="button"
                  onClick={() => handleTubeClick(index)}
                  animate={{
                    rotate: pouringFrom ? -18 : 0,
                    y: selected ? -4 : 0,
                    scale: pouringTo ? 1.03 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  className={`relative flex h-56 w-24 flex-col-reverse overflow-hidden rounded-[2rem] border bg-white/75 p-2 shadow-sm transition-all ${
                    selected ? 'border-sky-400 ring-4 ring-sky-200' : 'border-slate-200 hover:-translate-y-1'
                  }`}
                >
                  <div className="absolute inset-x-2 top-2 rounded-full bg-white/80 px-2 py-1 text-center text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    Bottle {index + 1}
                  </div>
                  {Array.from({ length: 4 }).map((_, slot) => {
                    const color = tube[slot];
                    return (
                      <motion.div
                        key={`${index}-${slot}-${color || 'empty'}`}
                        layout
                        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
                        className={`mt-2 h-10 rounded-2xl border ${
                          color
                            ? `bg-gradient-to-r ${COLOR_CLASS[color]} border-transparent shadow-lg shadow-slate-200/50`
                            : 'border-dashed border-slate-200 bg-slate-100/70'
                        }`}
                      >
                        {color ? <Droplets className="mx-auto mt-2 h-5 w-5 text-white/80" /> : null}
                      </motion.div>
                    );
                  })}
                </motion.button>
              </div>
            );
          })}
        </div>
        {solved ? (
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950">
            <div className="text-lg font-black">Solved cleanly.</div>
            <div className="mt-1 text-sm">Use the button above to feed the shared quest board and daily challenge progress.</div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
            Empty bottles create breathing room. Matching top colors keeps the pour smooth and reversible.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
