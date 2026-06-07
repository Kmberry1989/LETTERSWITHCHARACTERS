'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
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

const COLOR_MAP: Record<TubeColor, string> = {
  rose: '#fb7185', // pink-400
  sky: '#38bdf8',  // sky-400
  amber: '#fbbf24', // amber-400
  emerald: '#34d399', // emerald-400
};

const TUBE_WIDTH = 60;
const TUBE_HEIGHT = 200;
const TUBE_RADIUS = 15;
const MAX_CAPACITY = 4;

function canPour(from: Tube, to: Tube) {
  if (from.length === 0 || to.length === MAX_CAPACITY) return false;
  if (to.length === 0) return true;
  return from[from.length - 1] === to[to.length - 1];
}

function isSolved(tubes: Tube[]) {
  return tubes.every((tube) => tube.length === 0 || (tube.length === MAX_CAPACITY && new Set(tube).size === 1));
}

export default function LiquidSortGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tubes, setTubes] = useState<Tube[]>(INITIAL_TUBES);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const solved = useMemo(() => isSolved(tubes), [tubes]);

  // Canvas Animation & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const paddingX = 40;
      const paddingY = 60;
      const spacingX = (canvas.width - paddingX * 2 - TUBE_WIDTH) / 5; // 6 tubes = 5 gaps

      for (let i = 0; i < tubes.length; i++) {
        const x = paddingX + i * spacingX;
        let y = paddingY;
        
        // Elevate selected tube
        if (selectedTube === i) {
          y -= 20;
        }

        // Draw Liquid
        const tubeData = tubes[i];
        const sectionHeight = (TUBE_HEIGHT - 10) / MAX_CAPACITY;
        
        let currentY = y + TUBE_HEIGHT - 5; // Start from bottom
        
        for (let j = 0; j < tubeData.length; j++) {
          const color = COLOR_MAP[tubeData[j]];
          ctx.fillStyle = color;
          
          ctx.beginPath();
          // Add a wave effect to the top layer of the liquid
          if (j === tubeData.length - 1 && !solved) {
            const waveOffset = Math.sin(time + i) * 3;
            ctx.moveTo(x, currentY - sectionHeight + waveOffset);
            ctx.bezierCurveTo(
              x + TUBE_WIDTH / 2, currentY - sectionHeight - waveOffset,
              x + TUBE_WIDTH / 2, currentY - sectionHeight + waveOffset,
              x + TUBE_WIDTH, currentY - sectionHeight - waveOffset
            );
            ctx.lineTo(x + TUBE_WIDTH, currentY);
            ctx.lineTo(x, currentY);
          } else {
            ctx.rect(x, currentY - sectionHeight, TUBE_WIDTH, sectionHeight);
          }
          ctx.fill();
          
          currentY -= sectionHeight;
        }

        // Draw Tube Outline (Glass effect)
        ctx.strokeStyle = selectedTube === i ? '#38bdf8' : '#cbd5e1';
        ctx.lineWidth = selectedTube === i ? 4 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + TUBE_HEIGHT - TUBE_RADIUS);
        ctx.arcTo(x, y + TUBE_HEIGHT, x + TUBE_RADIUS, y + TUBE_HEIGHT, TUBE_RADIUS);
        ctx.lineTo(x + TUBE_WIDTH - TUBE_RADIUS, y + TUBE_HEIGHT);
        ctx.arcTo(x + TUBE_WIDTH, y + TUBE_HEIGHT, x + TUBE_WIDTH, y + TUBE_HEIGHT - TUBE_RADIUS, TUBE_RADIUS);
        ctx.lineTo(x + TUBE_WIDTH, y);
        ctx.stroke();

        // Draw Tube Number
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TUBE ${i + 1}`, x + TUBE_WIDTH / 2, y + TUBE_HEIGHT + 25);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [tubes, selectedTube, solved]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating || solved) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    const paddingX = 40;
    const spacingX = (canvas.width - paddingX * 2 - TUBE_WIDTH) / 5;
    
    // Determine which tube was clicked based on X coordinate
    let clickedIndex = -1;
    for (let i = 0; i < tubes.length; i++) {
      const x = paddingX + i * spacingX;
      if (mouseX >= x - 10 && mouseX <= x + TUBE_WIDTH + 10) {
        clickedIndex = i;
        break;
      }
    }

    if (clickedIndex === -1) return;

    if (selectedTube === null) {
      if (tubes[clickedIndex].length > 0) setSelectedTube(clickedIndex);
      return;
    }

    if (selectedTube === clickedIndex) {
      setSelectedTube(null);
      return;
    }

    const from = tubes[selectedTube];
    const to = tubes[clickedIndex];
    
    if (!canPour(from, to)) {
      setSelectedTube(clickedIndex); // Switch selection if invalid pour
      return;
    }

    // Perform pour
    setIsAnimating(true);
    const next = tubes.map((tube) => [...tube]);
    
    // Find how many blocks of the same color can be poured
    const colorToPour = from[from.length - 1];
    let blocksToPour = 0;
    for (let i = from.length - 1; i >= 0; i--) {
      if (from[i] === colorToPour && to.length + blocksToPour < MAX_CAPACITY) {
        blocksToPour++;
      } else {
        break;
      }
    }

    for (let i = 0; i < blocksToPour; i++) {
      next[clickedIndex].push(next[selectedTube].pop() as TubeColor);
    }

    setTubes(next);
    setMoves((value) => value + 1);
    setSelectedTube(null);
    
    // Simulate animation delay for fluid transfer
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const reset = () => {
    setTubes(INITIAL_TUBES.map((tube) => [...tube]));
    setSelectedTube(null);
    setMoves(0);
    setIsAnimating(false);
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] shadow-[0_20px_60px_rgba(14,116,144,0.14)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Fluid Sort</CardTitle>
          <CardDescription>Tap to pour matching colors. Smooth canvas fluid dynamics.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">Moves {moves}</Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved && <ArcadeSessionButton modeId="liquid-sort" score={Math.max(40, 100 - moves * 3)} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={320}
          onClick={handleCanvasClick}
          className="w-full max-w-4xl cursor-pointer touch-none rounded-2xl bg-white/50 border border-slate-200 shadow-inner"
        />
        {solved ? (
          <div className="w-full rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950">
            <div className="text-lg font-black">Solved cleanly.</div>
            <div className="mt-1 text-sm">Use the button above to feed the shared quest board and daily challenge progress.</div>
          </div>
        ) : (
          <div className="w-full rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
            Empty tubes are your breathing room. Same-color pours keep the board recoverable.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
