'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { RotateCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const TUBE_POSITIONS = [70, 190, 310, 430, 550, 670];
const WORLD_X = [-4.35, -2.61, -0.87, 0.87, 2.61, 4.35];
const STAGE_WIDTH = 740;
const STAGE_HEIGHT = 380;
const SLOT_HEIGHT = 0.48;
const TUBE_RADIUS = 0.34;

const LiquidSortSceneCanvas = dynamic(() => import('./liquid-sort-scene').then((module) => module.LiquidSortScene), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(223,239,252,0.88))]" />,
});

const COLOR_MAP: Record<TubeColor, string> = {
  rose: '#ef5da8',
  sky: '#32b6ef',
  amber: '#ffac2f',
  emerald: '#29c39a',
};

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

function cloneTubes(tubes: Tube[]) {
  return tubes.map((tube) => [...tube]);
}

function getDisplayTubes(tubes: Tube[], pour: PourState | null) {
  if (!pour) {
    return tubes.map((tube) => tube.map((color) => ({ color, fill: 1 })));
  }

  return tubes.map((tube, index) => {
    const segments = tube.map((color) => ({ color, fill: 1 }));

    if (index === pour.sourceIndex) {
      for (let moved = 0; moved < pour.amount; moved += 1) {
        const segment = segments[segments.length - 1 - moved];
        if (segment) {
          segment.fill = Math.max(0.08, 1 - pour.progress);
        }
      }
    }

    if (index === pour.targetIndex) {
      for (let moved = 0; moved < pour.amount; moved += 1) {
        segments.push({ color: pour.color, fill: Math.max(0.08, pour.progress) });
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
          next.pointerX <= left + 72 &&
          next.pointerY >= 50 &&
          next.pointerY <= 330
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
      const progress = Math.min(1, (time - startedAt) / 850);
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
    setDragState(null);
    dragRef.current = null;
    setHoverTarget(null);
    setPourState(null);
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
          {solved ? <ArcadeSessionButton modeId="liquid-sort" score={Math.max(80, 180 - moves * 8)} label="Bank clear" /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={stageRef}
          className="relative mx-auto overflow-hidden rounded-[40px] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(223,239,252,0.9))] shadow-inner"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
        >
          <div className="absolute inset-0">
            <LiquidSortSceneCanvas tubes={tubes} dragState={dragState} hoverTarget={hoverTarget} pourState={pourState} />
          </div>

          {TUBE_POSITIONS.map((left, index) => (
            <div
              key={index}
              onPointerDown={(event) => startDrag(index, event)}
              className="absolute top-[40px] h-[290px] w-[72px]"
              style={{ left, touchAction: 'none', cursor: pourState ? 'default' : 'grab' }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
