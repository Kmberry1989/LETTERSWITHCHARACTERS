'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createArcadeSessionId } from '@/lib/arcade/session-id';

type TubeColor = 'rose' | 'sky' | 'amber' | 'emerald';
type Tube = TubeColor[];
type DragState = {
  sourceIndex: number;
  pointerX: number;
  pointerY: number;
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

const TUBE_POSITIONS = [22, 142, 262, 382, 502, 622];
const TUBE_WIDTH = 92;
const TUBE_HEIGHT = 250;
const SLOT_HEIGHT = 44;
const STAGE_WIDTH = 736;
const STAGE_HEIGHT = 360;

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

export default function LiquidSortGame() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [tubes, setTubes] = useState<Tube[]>(cloneTubes(INITIAL_TUBES));
  const [moves, setMoves] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);
  const [pourState, setPourState] = useState<PourState | null>(null);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const displayTubes = useMemo(() => getDisplayTubes(tubes, pourState), [tubes, pourState]);
  const solved = useMemo(() => isSolved(tubes), [tubes]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const next = {
        sourceIndex: dragState.sourceIndex,
        pointerX: event.clientX - rect.left,
        pointerY: event.clientY - rect.top,
      };

      dragRef.current = next;
      setDragState(next);

      const nextTarget = TUBE_POSITIONS.findIndex((left, index) => {
        if (index === dragState.sourceIndex) return false;
        return (
          next.pointerX >= left &&
          next.pointerX <= left + TUBE_WIDTH &&
          next.pointerY >= 40 &&
          next.pointerY <= 320
        );
      });
      setHoverTarget(nextTarget === -1 ? null : nextTarget);
    };

    const handlePointerUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDragState(null);
      const targetIndex = hoverTarget;
      setHoverTarget(null);

      if (!current || targetIndex === null || targetIndex === current.sourceIndex) {
        return;
      }

      const source = tubes[current.sourceIndex];
      const target = tubes[targetIndex];
      const amount = getPourAmount(source, target);
      if (!amount) return;

      setPourState({
        sourceIndex: current.sourceIndex,
        targetIndex,
        color: source[source.length - 1],
        amount,
        progress: 0,
      });
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
      const progress = Math.min(1, (time - startedAt) / 760);
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
    setDragState(null);
    setHoverTarget(null);
    setPourState(null);
    setSessionId(createArcadeSessionId());
  };

  const startDrag = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (pourState || tubes[index].length === 0) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const next = {
      sourceIndex: index,
      pointerX: event.clientX - rect.left,
      pointerY: event.clientY - rect.top,
    };
    dragRef.current = next;
    setDragState(next);
  };

  return (
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,244,255,0.96))] shadow-[0_24px_70px_rgba(14,116,144,0.14)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-headline text-3xl">Liquid Sort</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Moves {moves}
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="liquid-sort" score={Math.max(80, 180 - moves * 8)} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={stageRef}
          className="relative mx-auto overflow-hidden rounded-[40px] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(219,235,248,0.92))] shadow-inner"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
        >
          {displayTubes.map((tube, index) => {
            const baseLeft = TUBE_POSITIONS[index];
            const isDragging = dragState?.sourceIndex === index;
            const isPouring = pourState?.sourceIndex === index;
            const progress = pourState?.progress || 0;
            const dragLeft = dragState ? dragState.pointerX - TUBE_WIDTH / 2 : baseLeft;
            const dragTop = dragState ? Math.max(18, dragState.pointerY - TUBE_HEIGHT / 2) : 70;
            const targetLeft = pourState ? TUBE_POSITIONS[pourState.targetIndex] - 18 : baseLeft;
            const left = isDragging ? dragLeft : isPouring ? baseLeft + (targetLeft - baseLeft) * Math.min(progress, 0.78) : baseLeft;
            const top = isDragging ? dragTop : isPouring ? 70 - Math.sin(progress * Math.PI) * 54 : 70;
            const rotate = isDragging ? -8 : isPouring ? -30 * Math.sin(Math.min(progress, 0.9) * Math.PI) : 0;
            const isTarget = hoverTarget === index || pourState?.targetIndex === index;

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left,
                  top,
                  width: TUBE_WIDTH,
                  height: TUBE_HEIGHT,
                  transform: `rotate(${rotate}deg) scale(${isTarget ? 1.02 : 1})`,
                  transition: isDragging ? 'none' : 'transform 200ms ease, left 220ms ease, top 220ms ease',
                  zIndex: isDragging || isPouring ? 30 : 10,
                }}
              >
                <div className="pointer-events-none absolute left-1/2 top-[-12px] z-20 -translate-x-1/2 rounded-full bg-white/88 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                  {index + 1}
                </div>
                <div
                  onPointerDown={(event) => startDrag(index, event)}
                  className="relative h-full w-full overflow-hidden rounded-[34px] border-[5px] border-white/85 bg-white/55 shadow-[0_20px_40px_rgba(15,23,42,0.12)]"
                  style={{ cursor: pourState ? 'default' : 'grab', touchAction: 'none' }}
                >
                  <div className="absolute inset-[9px] rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))]" />
                  <div className="absolute inset-x-[15px] top-[16px] h-[12px] rounded-full bg-white/55" />

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
                            transform: `translateY(${isTopSegment && pourState ? Math.sin(progress * Math.PI * 2) * 1.6 : 0}px)`,
                          }}
                        />
                      </div>
                    );
                  })}

                  <div className="pointer-events-none absolute left-[22px] top-[20px] bottom-[22px] w-[10px] rounded-full bg-white/35 blur-[1px]" />
                </div>
              </div>
            );
          })}

          {pourState ? (
            <div
              className="pointer-events-none absolute z-20 origin-left rounded-full"
              style={{
                left: TUBE_POSITIONS[pourState.sourceIndex] + 62,
                top: 84,
                width:
                  Math.abs(TUBE_POSITIONS[pourState.targetIndex] - TUBE_POSITIONS[pourState.sourceIndex]) + 22,
                height: 10,
                background: COLOR_MAP[pourState.color].liquid,
                boxShadow: `0 8px 20px ${COLOR_MAP[pourState.color].glow}`,
                transform: `rotate(${TUBE_POSITIONS[pourState.targetIndex] > TUBE_POSITIONS[pourState.sourceIndex] ? 14 : -14}deg) scaleX(${Math.max(0.15, pourState.progress)})`,
                opacity: Math.min(1, pourState.progress * 1.4),
                transition: 'transform 40ms linear, opacity 40ms linear',
              }}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
