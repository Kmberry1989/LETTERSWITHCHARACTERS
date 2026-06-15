'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type TubeColor = 'rose' | 'sky' | 'amber';
type Tube = TubeColor[];

const CAPACITY = 4;
const INITIAL_TUBES: Tube[] = [
  ['rose', 'sky', 'amber', 'rose'],
  ['sky', 'amber', 'rose', 'sky'],
  ['amber', 'rose', 'sky', 'amber'],
  [],
  [],
  [],
];

const COLOR_MAP: Record<TubeColor, { liquid: string; glow: string; label: string }> = {
  rose: { liquid: 'linear-gradient(180deg,#fb7185 0%,#ec4899 100%)', glow: 'rgba(244,114,182,0.28)', label: 'Rose' },
  sky: { liquid: 'linear-gradient(180deg,#38bdf8 0%,#0ea5e9 100%)', glow: 'rgba(56,189,248,0.28)', label: 'Sky' },
  amber: { liquid: 'linear-gradient(180deg,#fbbf24 0%,#f97316 100%)', glow: 'rgba(251,191,36,0.3)', label: 'Amber' },
};

function cloneTubes(tubes: Tube[]) {
  return tubes.map((tube) => [...tube]);
}

function topColor(tube: Tube) {
  return tube[tube.length - 1] || null;
}

function canPour(from: Tube, to: Tube) {
  const color = topColor(from);
  if (!color || to.length >= CAPACITY) return false;
  const targetColor = topColor(to);
  return !targetColor || targetColor === color;
}

function pourAmount(from: Tube, to: Tube) {
  if (!canPour(from, to)) return 0;
  const color = topColor(from);
  let amount = 0;
  for (let index = from.length - 1; index >= 0 && from[index] === color; index -= 1) {
    amount += 1;
  }
  return Math.min(amount, CAPACITY - to.length);
}

function applyPour(tubes: Tube[], sourceIndex: number, targetIndex: number) {
  const next = cloneTubes(tubes);
  const amount = pourAmount(next[sourceIndex], next[targetIndex]);
  for (let move = 0; move < amount; move += 1) {
    const color = next[sourceIndex].pop();
    if (color) next[targetIndex].push(color);
  }
  return { next, amount };
}

function isSolved(tubes: Tube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === CAPACITY && tube.every((color) => color === tube[0])));
}

export default function LiquidSortGame() {
  const { playSfx } = useAudio();
  const [tubes, setTubes] = useState<Tube[]>(() => cloneTubes(INITIAL_TUBES));
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('Tap a tube, then a matching or empty tube.');
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const solved = useMemo(() => isSolved(tubes), [tubes]);

  const reset = () => {
    playSfx('swoosh');
    setTubes(cloneTubes(INITIAL_TUBES));
    setSelectedSource(null);
    setMoves(0);
    setMessage('Tap a tube, then a matching or empty tube.');
    setSessionId(createArcadeSessionId());
  };

  const handleTubeClick = (index: number) => {
    if (solved) return;
    const tube = tubes[index];

    if (selectedSource === null) {
      if (tube.length === 0) {
        playSfx('arcadeError');
        setMessage('Pick a tube with liquid first.');
        return;
      }
      playSfx('arcadeSelect');
      setSelectedSource(index);
      setMessage(`Tube ${index + 1} selected.`);
      return;
    }

    if (selectedSource === index) {
      playSfx('click');
      setSelectedSource(null);
      setMessage('Selection cleared.');
      return;
    }

    const { next, amount } = applyPour(tubes, selectedSource, index);
    if (!amount) {
      playSfx(tube.length > 0 ? 'arcadeSelect' : 'arcadeError');
      setSelectedSource(tube.length > 0 ? index : null);
      setMessage(tube.length > 0 ? `Tube ${index + 1} selected instead.` : 'That pour does not fit.');
      return;
    }

    playSfx('sortPour');
    setTubes(next);
    setMoves((value) => value + 1);
    setSelectedSource(null);
    setMessage('Poured.');
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,244,255,0.96))] p-2 shadow-[0_24px_70px_rgba(14,116,144,0.14)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {moves}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={reset} aria-label="Reset">
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="liquid-sort" score={Math.max(100, 180 - moves * 8)} /> : null}
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col justify-start rounded-[1.4rem] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(219,235,248,0.92))] p-2 pt-5 shadow-inner md:justify-center md:p-4"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
            {tubes.map((tube, index) => {
              const selected = selectedSource === index;
              const source = selectedSource !== null ? tubes[selectedSource] : null;
              const validTarget = selectedSource !== null && selectedSource !== index && canPour(source || [], tube);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTubeClick(index)}
                  className={cn(
                    'relative flex h-[clamp(10.5rem,32svh,14rem)] flex-col justify-end overflow-hidden rounded-[1.35rem] border-[3px] border-white/85 bg-white/58 px-2 pb-3 pt-4 shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition-all md:h-[15.5rem] md:rounded-[2rem] md:border-[4px]',
                    selected && 'scale-[1.02] ring-4 ring-sky-100',
                    validTarget && 'ring-4 ring-emerald-100'
                  )}
                  aria-label={`Tube ${index + 1}`}
                >
                  <span className="pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.16em] text-slate-500">
                    {index + 1}
                  </span>
                  <span className="pointer-events-none absolute inset-[7px] rounded-[1.05rem] border border-slate-200/80 md:rounded-[1.55rem]" />
                  <span className="pointer-events-none absolute inset-x-[14px] top-[18px] h-[8px] rounded-full bg-white/55" />

                  <div className="relative z-10 flex h-full flex-col-reverse justify-start gap-1 pt-6">
                    {tube.map((color, segmentIndex) => (
                      <div
                        key={`${index}-${segmentIndex}-${color}`}
                        className="h-1/4 rounded-xl"
                        title={COLOR_MAP[color].label}
                        style={{
                          background: COLOR_MAP[color].liquid,
                          boxShadow: `0 8px 18px ${COLOR_MAP[color].glow}`,
                        }}
                      />
                    ))}
                    {Array.from({ length: CAPACITY - tube.length }).map((_, emptyIndex) => (
                      <div key={`empty-${emptyIndex}`} className="h-1/4 rounded-xl border border-dashed border-slate-200/70 bg-white/20" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-5 text-center text-xs font-semibold text-slate-600 md:text-sm">
          {solved ? 'Sorted.' : message}
        </div>
      </div>
    </GameScreen>
  );
}
