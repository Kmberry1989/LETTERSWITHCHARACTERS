'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type TubeColor = 'rose' | 'sky' | 'amber' | 'emerald';
type Tube = TubeColor[];
type DragState = {
  sourceIndex: number;
  startX: number;
  startY: number;
  moved: boolean;
};
type PourState = {
  sourceIndex: number;
  targetIndex: number;
  color: TubeColor;
  amount: number;
  progress: number;
};

const INITIAL_TUBES: Tube[] = [
  ['rose', 'sky', 'amber', 'rose'],
  ['emerald', 'amber', 'sky', 'emerald'],
  ['amber', 'rose', 'emerald', 'sky'],
  ['sky', 'emerald', 'rose', 'amber'],
  [],
  [],
];

const COLOR_MAP: Record<TubeColor, { liquid: string; glow: string }> = {
  rose: { liquid: 'linear-gradient(180deg,#fb7185 0%,#ec4899 100%)', glow: 'rgba(244, 114, 182, 0.25)' },
  sky: { liquid: 'linear-gradient(180deg,#38bdf8 0%,#0ea5e9 100%)', glow: 'rgba(56, 189, 248, 0.25)' },
  amber: { liquid: 'linear-gradient(180deg,#fbbf24 0%,#f97316 100%)', glow: 'rgba(251, 191, 36, 0.28)' },
  emerald: { liquid: 'linear-gradient(180deg,#34d399 0%,#14b8a6 100%)', glow: 'rgba(52, 211, 153, 0.25)' },
};

const SLOT_HEIGHT = 44;

function cloneTubes(tubes: Tube[]) {
  return tubes.map((tube) => [...tube]);
}

function canPour(from: Tube, to: Tube) {
  if (from.length === 0 || to.length === 4) return false;
  if (to.length === 0) return true;
  return from[from.length - 1] === to[to.length - 1];
}

function getPourAmount(from: Tube, to: Tube) {
  if (!canPour(from, to)) return 0;
  const color = from[from.length - 1];
  let sameColorCount = 0;
  for (let index = from.length - 1; index >= 0 && from[index] === color; index -= 1) {
    sameColorCount += 1;
  }
  return Math.min(sameColorCount, 4 - to.length);
}

function isSolved(tubes: Tube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === 4 && new Set(tube).size === 1));
}

function getDisplayTubes(tubes: Tube[], pourState: PourState | null) {
  if (!pourState) {
    return tubes.map((tube) => tube.map((color) => ({ color, fill: 1 })));
  }

  return tubes.map((tube, index) => {
    const segments = tube.map((color) => ({ color, fill: 1 }));

    if (index === pourState.sourceIndex) {
      for (let moved = 0; moved < pourState.amount; moved += 1) {
        const segment = segments[segments.length - 1 - moved];
        if (segment) {
          segment.fill = Math.max(0.1, 1 - pourState.progress);
        }
      }
    }

    if (index === pourState.targetIndex) {
      for (let moved = 0; moved < pourState.amount; moved += 1) {
        segments.push({ color: pourState.color, fill: Math.max(0.1, pourState.progress) });
      }
    }

    return segments;
  });
}

function findTubeIndexAtPoint(tubeRefs: Array<HTMLButtonElement | null>, x: number, y: number, sourceIndex: number) {
  return tubeRefs.findIndex((tube, index) => {
    if (!tube || index === sourceIndex) return false;
    const rect = tube.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  });
}

export default function LiquidSortGame() {
  const tubeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [tubes, setTubes] = useState<Tube[]>(cloneTubes(INITIAL_TUBES));
  const [moves, setMoves] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);
  const [pourState, setPourState] = useState<PourState | null>(null);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const displayTubes = useMemo(() => getDisplayTubes(tubes, pourState), [tubes, pourState]);
  const solved = useMemo(() => isSolved(tubes), [tubes]);

  const queuePour = (sourceIndex: number, targetIndex: number) => {
    const source = tubes[sourceIndex];
    const target = tubes[targetIndex];
    const amount = getPourAmount(source, target);
    if (!amount) return false;

    setPourState({
      sourceIndex,
      targetIndex,
      color: source[source.length - 1],
      amount,
      progress: 0,
    });
    return true;
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const moved = current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 8;
      const next = { ...current, moved };
      dragRef.current = next;
      setDragState(next);
      if (!moved) return;

      const nextTarget = findTubeIndexAtPoint(tubeRefs.current, event.clientX, event.clientY, current.sourceIndex);
      setHoverTarget(nextTarget === -1 ? null : nextTarget);
    };

    const handlePointerUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDragState(null);

      if (!current) {
        setHoverTarget(null);
        return;
      }

      if (current.moved) {
        suppressClickRef.current = true;
        if (hoverTarget !== null) {
          queuePour(current.sourceIndex, hoverTarget);
          setSelectedSource(null);
        }
      }

      setHoverTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, hoverTarget, tubes]);

  useEffect(() => {
    if (!pourState) return;

    const startedAt = performance.now();
    let frame = 0;

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 560);
      setPourState((current) => (current ? { ...current, progress } : current));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
        return;
      }

      setTubes((current) => {
        const next = cloneTubes(current);
        for (let moved = 0; moved < pourState.amount; moved += 1) {
          next[pourState.targetIndex].push(next[pourState.sourceIndex].pop() as TubeColor);
        }
        return next;
      });
      setMoves((value) => value + 1);
      setPourState(null);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [pourState]);

  const reset = () => {
    setTubes(cloneTubes(INITIAL_TUBES));
    setMoves(0);
    dragRef.current = null;
    suppressClickRef.current = false;
    setDragState(null);
    setSelectedSource(null);
    setHoverTarget(null);
    setPourState(null);
    setSessionId(createArcadeSessionId());
  };

  const startDrag = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (pourState || tubes[index].length === 0) return;

    const next = {
      sourceIndex: index,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    dragRef.current = next;
    setDragState(next);
  };

  const handleTubeClick = (index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (pourState) return;

    if (selectedSource === null) {
      if (tubes[index].length === 0) return;
      setSelectedSource(index);
      return;
    }

    if (selectedSource === index) {
      setSelectedSource(null);
      return;
    }

    if (queuePour(selectedSource, index)) {
      setSelectedSource(null);
      return;
    }

    setSelectedSource(tubes[index].length > 0 ? index : null);
  };

  return (
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,244,255,0.96))] shadow-[0_24px_70px_rgba(14,116,144,0.14)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CardTitle className="font-headline text-3xl">Liquid Sort</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Moves {moves}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Tap or drag tubes
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="liquid-sort" score={Math.max(80, 180 - moves * 8)} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[32px] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(219,235,248,0.92))] p-3 shadow-inner sm:p-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {displayTubes.map((tube, index) => {
              const isDragging = dragState?.sourceIndex === index && dragState.moved;
              const isSelected = selectedSource === index;
              const isTarget = hoverTarget === index;
              const isPouringTarget = pourState?.targetIndex === index;

              return (
                <button
                  key={index}
                  ref={(node) => {
                    tubeRefs.current[index] = node;
                  }}
                  type="button"
                  onPointerDown={(event) => startDrag(index, event)}
                  onClick={() => handleTubeClick(index)}
                  className={cn(
                    'relative h-[12rem] overflow-visible rounded-[2rem] border-[4px] border-white/85 bg-white/55 px-2 pb-4 pt-5 shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition-all min-[360px]:h-[13rem] sm:h-[15.5rem]',
                    (isSelected || isDragging) && 'scale-[1.02] ring-4 ring-sky-100',
                    isTarget && 'ring-4 ring-emerald-100',
                    isPouringTarget && 'ring-4 ring-sky-100'
                  )}
                  style={{ touchAction: 'none' }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-[-12px] z-20 -translate-x-1/2 rounded-full bg-white/88 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {index + 1}
                  </div>
                  <div className="absolute inset-[8px] rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))]" />
                  <div className="absolute inset-x-[14px] top-[16px] h-[10px] rounded-full bg-white/55" />

                  {tube.map((segment, segmentIndex) => {
                    const color = COLOR_MAP[segment.color];
                    const height = Math.max(10, SLOT_HEIGHT * segment.fill);
                    const bottom = 16 + segmentIndex * SLOT_HEIGHT;
                    const isTopSegment = segmentIndex === tube.length - 1;

                    return (
                      <div
                        key={`${index}-${segmentIndex}-${segment.color}-${segment.fill}`}
                        className="absolute left-[12px] right-[12px] overflow-hidden"
                        style={{
                          bottom,
                          height,
                          borderRadius: isTopSegment ? 18 : 14,
                          background: color.liquid,
                          boxShadow: `0 10px 24px ${color.glow}`,
                          transition: 'height 80ms linear',
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-[8px]"
                          style={{
                            background: 'linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0))',
                            borderTopLeftRadius: 18,
                            borderTopRightRadius: 18,
                            transform: `translateY(${isTopSegment && pourState ? Math.sin(pourState.progress * Math.PI * 2) * 1.6 : 0}px)`,
                          }}
                        />
                      </div>
                    );
                  })}

                  <div className="pointer-events-none absolute left-[22px] top-[18px] bottom-[22px] w-[8px] rounded-full bg-white/35 blur-[1px]" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-center text-sm font-medium text-slate-600">
          {selectedSource !== null ? `Tube ${selectedSource + 1} selected. Choose a destination tube.` : 'Keep each color in its own tube.'}
        </div>
      </CardContent>
    </Card>
  );
}
