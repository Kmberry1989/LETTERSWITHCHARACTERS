'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
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

function LiquidSortScene({
  tubes,
  dragState,
  hoverTarget,
  pourState,
}: {
  tubes: Tube[];
  dragState: DragState | null;
  hoverTarget: number | null;
  pourState: PourState | null;
}) {
  const displayTubes = useMemo(() => getDisplayTubes(tubes, pourState), [tubes, pourState]);

  return (
    <Canvas orthographic camera={{ position: [0, 0, 12], zoom: 72 }}>
      <color attach="background" args={['#eef7ff']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 8]} intensity={1.4} />
      <pointLight position={[-4, 3, 5]} intensity={0.45} color="#d8f1ff" />

      <mesh position={[0, -0.1, -1]}>
        <boxGeometry args={[11.5, 5.2, 0.4]} />
        <meshStandardMaterial color="#edf6ff" transparent opacity={0.98} />
      </mesh>

      {displayTubes.map((tube, index) => {
        const isDragging = dragState?.sourceIndex === index;
        const isPouring = pourState?.sourceIndex === index;
        const progress = pourState?.progress || 0;
        const baseX = WORLD_X[index];
        const dragX = dragState ? ((dragState.pointerX / STAGE_WIDTH) - 0.5) * 12 : baseX;
        const dragY = dragState ? -((dragState.pointerY / STAGE_HEIGHT) - 0.5) * 7 + 0.3 : 0;
        const targetX = pourState ? WORLD_X[pourState.targetIndex] - 0.55 : baseX;
        const x = isDragging ? dragX : isPouring ? baseX + (targetX - baseX) * Math.min(progress, 0.75) : baseX;
        const y = isDragging ? dragY : isPouring ? 1.2 * Math.sin(progress * Math.PI) + 0.5 : 0;
        const rotation = isDragging ? -0.14 : isPouring ? -0.62 * Math.sin(Math.min(progress, 0.9) * Math.PI) : 0;
        const emphasize = hoverTarget === index && dragState && dragState.sourceIndex !== index;

        return (
          <group key={index} position={[x, y, 0]} rotation={[0, 0, rotation]}>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 3.95, 48, 1, true]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.04} roughness={0.08} transmission={0.72} transparent opacity={0.34} thickness={0.65} />
            </mesh>
            <mesh position={[0, 1.91, 0]}>
              <torusGeometry args={[0.53, 0.07, 16, 80]} />
              <meshStandardMaterial color={emphasize ? '#7dd3fc' : '#ffffff'} metalness={0.14} roughness={0.22} />
            </mesh>
            <mesh position={[0, -2.06, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 0.1, 48]} />
              <meshStandardMaterial color="#ffffff" metalness={0.08} roughness={0.18} />
            </mesh>

            {tube.map((segment, segmentIndex) => (
              <group key={`${index}-${segmentIndex}-${segment.color}-${segment.fill}`} position={[0, -1.78 + segmentIndex * SLOT_HEIGHT + segment.fill * SLOT_HEIGHT * 0.5, 0]}>
                <mesh>
                  <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, Math.max(0.08, SLOT_HEIGHT * segment.fill), 32]} />
                  <meshStandardMaterial color={COLOR_MAP[segment.color]} roughness={0.2} metalness={0.04} emissive={COLOR_MAP[segment.color]} emissiveIntensity={0.12} />
                </mesh>
              </group>
            ))}

            <mesh position={[0, 0.98, 0.02]}>
              <planeGeometry args={[0.68, 3.25]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.16} />
            </mesh>
          </group>
        );
      })}
    </Canvas>
  );
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
            <LiquidSortScene tubes={tubes} dragState={dragState} hoverTarget={hoverTarget} pourState={pourState} />
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
