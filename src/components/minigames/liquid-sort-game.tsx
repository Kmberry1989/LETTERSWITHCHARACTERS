'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  offsetX: number;
  offsetY: number;
};

type PourAnimation = {
  sourceIndex: number;
  targetIndex: number;
  color: TubeColor;
  startedAt: number;
};

type SurfaceMotion = {
  amplitude: number;
  startedAt: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

const INITIAL_TUBES: Tube[] = [
  ['rose', 'sky', 'amber', 'rose'],
  ['emerald', 'amber', 'sky', 'emerald'],
  ['amber', 'rose', 'emerald', 'sky'],
  ['sky', 'emerald', 'rose', 'amber'],
  [],
  [],
];

const COLOR_MAP: Record<TubeColor, { base: string; glow: string; fill: string }> = {
  rose: { base: '#f43f5e', glow: 'rgba(244,63,94,0.28)', fill: 'from-rose-400 to-pink-500' },
  sky: { base: '#38bdf8', glow: 'rgba(56,189,248,0.28)', fill: 'from-sky-400 to-cyan-500' },
  amber: { base: '#f59e0b', glow: 'rgba(245,158,11,0.28)', fill: 'from-amber-300 to-orange-500' },
  emerald: { base: '#34d399', glow: 'rgba(52,211,153,0.28)', fill: 'from-emerald-400 to-teal-500' },
};

const BOTTLE_WIDTH = 92;
const BOTTLE_HEIGHT = 250;
const SLOT_HEIGHT = 44;
const STAGE_WIDTH = 760;
const STAGE_HEIGHT = 360;
const BOTTLE_POSITIONS = [
  { x: 24, y: 78 },
  { x: 144, y: 78 },
  { x: 264, y: 78 },
  { x: 384, y: 78 },
  { x: 504, y: 78 },
  { x: 624, y: 78 },
];

function canPour(from: Tube, to: Tube) {
  if (from.length === 0 || to.length === 4) return false;
  if (to.length === 0) return true;
  return from[from.length - 1] === to[to.length - 1];
}

function isSolved(tubes: Tube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === 4 && new Set(tube).size === 1));
}

function bottleCenter(index: number) {
  const pos = BOTTLE_POSITIONS[index];
  return {
    x: pos.x + BOTTLE_WIDTH / 2,
    y: pos.y + BOTTLE_HEIGHT / 2,
  };
}

function bottleTop(index: number) {
  const pos = BOTTLE_POSITIONS[index];
  return {
    x: pos.x + BOTTLE_WIDTH / 2,
    y: pos.y + 32,
  };
}

function bottleSurfaceY(tubeLength: number) {
  return BOTTLE_HEIGHT - 28 - tubeLength * SLOT_HEIGHT;
}

export default function LiquidSortGame() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dragRef = useRef<DragState | null>(null);

  const [tubes, setTubes] = useState<Tube[]>(INITIAL_TUBES);
  const [moves, setMoves] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pourAnimation, setPourAnimation] = useState<PourAnimation | null>(null);
  const [surfaceMotion, setSurfaceMotion] = useState<Record<number, SurfaceMotion>>({});

  const solved = useMemo(() => isSolved(tubes), [tubes]);

  useEffect(() => {
    if (!pourAnimation) return;

    const sourceTop = bottleTop(pourAnimation.sourceIndex);
    const targetTop = bottleTop(pourAnimation.targetIndex);
    let frame = 0;
    const streamStart = { x: sourceTop.x + 18, y: sourceTop.y - 12 };
    const streamEnd = { x: targetTop.x - 10, y: targetTop.y + 8 };

    const emit = () => {
      frame += 1;
      if (frame % 2 === 0) {
        particlesRef.current.push(
          ...Array.from({ length: 8 }, () => ({
            x: streamStart.x + Math.random() * 6,
            y: streamStart.y + Math.random() * 6,
            vx: (streamEnd.x - streamStart.x) * 0.05 + (Math.random() - 0.5) * 1.8,
            vy: (streamEnd.y - streamStart.y) * 0.05 + Math.random() * 1.6,
            life: 1,
          }))
        );
      }
    };

    const interval = window.setInterval(emit, 16);
    const transfer = window.setTimeout(() => {
      setTubes((current) => {
        const next = current.map((tube) => [...tube]);
        next[pourAnimation.targetIndex].push(next[pourAnimation.sourceIndex].pop() as TubeColor);
        return next;
      });
      setMoves((value) => value + 1);
      setSurfaceMotion((current) => ({
        ...current,
        [pourAnimation.sourceIndex]: { amplitude: 5, startedAt: performance.now() },
        [pourAnimation.targetIndex]: { amplitude: 10, startedAt: performance.now() },
      }));
    }, 640);
    const finish = window.setTimeout(() => {
      setPourAnimation(null);
    }, 1080);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(transfer);
      window.clearTimeout(finish);
    };
  }, [pourAnimation]);

  useEffect(() => {
    let raf = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        raf = window.requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.16,
          life: particle.life - 0.025,
        }))
        .filter((particle) => particle.life > 0);

      if (pourAnimation) {
        const sourceTop = bottleTop(pourAnimation.sourceIndex);
        const targetTop = bottleTop(pourAnimation.targetIndex);
        ctx.strokeStyle = COLOR_MAP[pourAnimation.color].base;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = COLOR_MAP[pourAnimation.color].glow;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(sourceTop.x + 18, sourceTop.y - 10);
        ctx.bezierCurveTo(
          sourceTop.x + 70,
          sourceTop.y - 26,
          targetTop.x - 48,
          targetTop.y - 8,
          targetTop.x - 6,
          targetTop.y + 6
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      for (const particle of particlesRef.current) {
        ctx.globalAlpha = Math.max(0.18, particle.life);
        ctx.fillStyle = pourAnimation ? COLOR_MAP[pourAnimation.color].base : '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2 + particle.life * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [pourAnimation]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const next = dragRef.current;
      if (!next) return;
      const state = {
        ...next,
        pointerX: event.clientX,
        pointerY: event.clientY,
      };
      dragRef.current = state;
      setDragState(state);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;

      dragRef.current = null;
      setDragState(null);

      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const targetIndex = BOTTLE_POSITIONS.findIndex((position, index) => {
        if (index === current.sourceIndex) return false;
        return (
          localX >= position.x &&
          localX <= position.x + BOTTLE_WIDTH &&
          localY >= position.y &&
          localY <= position.y + BOTTLE_HEIGHT
        );
      });

      if (targetIndex === -1) return;
      const from = tubes[current.sourceIndex];
      const to = tubes[targetIndex];
      if (!canPour(from, to)) return;

      setPourAnimation({
        sourceIndex: current.sourceIndex,
        targetIndex,
        color: from[from.length - 1],
        startedAt: performance.now(),
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [tubes]);

  const reset = () => {
    setTubes(INITIAL_TUBES.map((tube) => [...tube]));
    setMoves(0);
    setDragState(null);
    dragRef.current = null;
    setPourAnimation(null);
    particlesRef.current = [];
    setSurfaceMotion({});
  };

  const startDrag = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (pourAnimation || tubes[index].length === 0) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = BOTTLE_POSITIONS[index];
    const state: DragState = {
      sourceIndex: index,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: event.clientX - (rect.left + position.x),
      offsetY: event.clientY - (rect.top + position.y),
    };
    dragRef.current = state;
    setDragState(state);
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,246,255,0.92))] shadow-[0_24px_70px_rgba(14,116,144,0.14)]">
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
          {solved && <ArcadeSessionButton modeId="liquid-sort" score={Math.max(40, 120 - moves * 3)} label="Bank clear" />}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={stageRef}
          className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(214,234,248,0.74))] p-4 shadow-inner"
          style={{ height: STAGE_HEIGHT }}
        >
          <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
          {tubes.map((tube, index) => {
            const base = BOTTLE_POSITIONS[index];
            const isDragging = dragState?.sourceIndex === index;
            const isAnimating = pourAnimation?.sourceIndex === index;
            const isTarget = pourAnimation?.targetIndex === index;
            const pointerRect = stageRef.current?.getBoundingClientRect();
            const dragX =
              pointerRect && dragState
                ? dragState.pointerX - pointerRect.left - dragState.offsetX
                : base.x;
            const dragY =
              pointerRect && dragState
                ? dragState.pointerY - pointerRect.top - dragState.offsetY
                : base.y;
            const target = pourAnimation
              ? bottleCenter(pourAnimation.targetIndex)
              : null;
            const sourceTop = pourAnimation
              ? bottleTop(pourAnimation.sourceIndex)
              : null;
            const animateX = isDragging
              ? dragX
              : isAnimating && target
                ? target.x - BOTTLE_WIDTH / 2 - 18
                : base.x;
            const animateY = isDragging
              ? dragY
              : isAnimating && sourceTop && target
                ? Math.min(sourceTop.y - 26, target.y - 118)
                : base.y;
            const rotate = isAnimating ? -34 : 0;
            const surfaceWave = surfaceMotion[index];
            const decay = surfaceWave ? Math.max(0, 1 - (performance.now() - surfaceWave.startedAt) / 1400) : 0;
            const waveHeight = (surfaceWave?.amplitude || 0) * decay;

            return (
              <motion.div
                key={index}
                className="absolute z-10"
                animate={{ x: animateX, y: animateY, rotate, scale: isTarget ? 1.03 : 1 }}
                transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 18 }}
                onPointerDown={(event) => startDrag(index, event)}
                style={{ left: 0, top: 0, touchAction: 'none', cursor: pourAnimation ? 'default' : 'grab' }}
              >
                <div className="pointer-events-none absolute left-1/2 top-[18px] z-30 -translate-x-1/2 rounded-full bg-white/88 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                  {index + 1}
                </div>
                <div className={`relative h-[250px] w-[92px] overflow-hidden rounded-[34px] border-4 bg-white/60 shadow-[0_20px_40px_rgba(15,23,42,0.12)] ${isDragging ? 'border-sky-400' : 'border-white/80'}`}>
                  <div className="absolute inset-[10px] rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.06))]" />
                  {Array.from({ length: 4 }).map((_, slot) => {
                    const color = tube[slot];
                    const nextColor = tube[slot + 1];
                    const bottom = 14 + slot * SLOT_HEIGHT;
                    return color ? (
                      <div
                        key={`${index}-${slot}-${color}`}
                        className={`absolute left-[12px] right-[12px] rounded-[18px] bg-gradient-to-r ${COLOR_MAP[color].fill}`}
                        style={{
                          bottom,
                          height: SLOT_HEIGHT + (nextColor ? 2 : 0),
                          boxShadow: `0 10px 24px ${COLOR_MAP[color].glow}`,
                        }}
                      />
                    ) : null;
                  })}
                  {tube.length > 0 ? (
                    <motion.div
                      className={`absolute left-[12px] right-[12px] rounded-t-[18px] bg-gradient-to-r ${COLOR_MAP[tube[tube.length - 1]].fill}`}
                      animate={{
                        y: [0, -waveHeight, 0],
                        borderTopLeftRadius: [18, 24, 18],
                        borderTopRightRadius: [18, 14, 18],
                      }}
                      transition={{ duration: 0.7, repeat: decay > 0.05 ? Infinity : 0, ease: 'easeInOut' }}
                      style={{
                        bottom: bottleSurfaceY(tube.length),
                        height: 14,
                        opacity: 0.96,
                      }}
                    />
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
