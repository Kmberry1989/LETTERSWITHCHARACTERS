'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Group = 'Fruit' | 'Travel' | 'Weather';
type Item = {
  id: string;
  emoji: string;
  label: string;
  group: Group;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isSorted: boolean;
};

const INITIAL_ITEMS: Omit<Item, 'x' | 'y' | 'targetX' | 'targetY' | 'isSorted'>[] = [
  { id: 'apple', emoji: '🍎', label: 'Apple', group: 'Fruit' },
  { id: 'banana', emoji: '🍌', label: 'Banana', group: 'Fruit' },
  { id: 'plane', emoji: '✈️', label: 'Plane', group: 'Travel' },
  { id: 'map', emoji: '🗺️', label: 'Map', group: 'Travel' },
  { id: 'sun', emoji: '☀️', label: 'Sun', group: 'Weather' },
  { id: 'rain', emoji: '🌧️', label: 'Rain', group: 'Weather' },
];

const GROUPS: Group[] = ['Fruit', 'Travel', 'Weather'];

// Canvas constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const ITEM_RADIUS = 35;
const BIN_WIDTH = 220;
const BIN_HEIGHT = 120;

export default function MatchSortGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize items with random starting positions in the "Tray" (bottom half)
  const initializeItems = () => {
    return INITIAL_ITEMS.map((item, index) => {
      const startX = 100 + (index * 120) % (CANVAS_WIDTH - 200);
      const startY = CANVAS_HEIGHT - 80 + Math.random() * 20 - 10;
      return {
        ...item,
        x: startX,
        y: startY,
        targetX: startX,
        targetY: startY,
        isSorted: false,
      };
    });
  };

  const [items, setItems] = useState<Item[]>(initializeItems());
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [status, setStatus] = useState('Drag an item into the matching category bin.');

  const solved = useMemo(() => items.every((i) => i.isSorted), [items]);

  // Animation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Bins (Top Half)
      GROUPS.forEach((group, index) => {
        const binX = 40 + index * (BIN_WIDTH + 20);
        const binY = 30;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.roundRect(binX, binY, BIN_WIDTH, BIN_HEIGHT, 16);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(group, binX + BIN_WIDTH / 2, binY + 30);
      });

      // Draw Tray Area separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, CANVAS_HEIGHT - 130);
      ctx.lineTo(CANVAS_WIDTH - 40, CANVAS_HEIGHT - 130);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('LOOSE TRAY', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 110);

      // Interpolate positions for smooth movement
      setItems((currentItems) => {
        let needsUpdate = false;
        const newItems = currentItems.map((item) => {
          if (draggedItemId === item.id) return item; // Don't interpolate while dragging
          
          const dx = item.targetX - item.x;
          const dy = item.targetY - item.y;
          
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            needsUpdate = true;
            return {
              ...item,
              x: item.x + dx * 0.2, // Spring factor
              y: item.y + dy * 0.2,
            };
          }
          return { ...item, x: item.targetX, y: item.targetY };
        });

        // Draw Items (Sort so dragged item is on top)
        const sortedForDraw = [...newItems].sort((a, b) => 
          (a.id === draggedItemId ? 1 : 0) - (b.id === draggedItemId ? 1 : 0)
        );

        sortedForDraw.forEach((item) => {
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.beginPath();
          ctx.arc(item.x + 2, item.y + 4, ITEM_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Circle background
          ctx.fillStyle = item.id === draggedItemId ? '#10b981' : item.isSorted ? '#f8fafc' : '#ffffff';
          ctx.strokeStyle = item.isSorted ? '#cbd5e1' : '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, ITEM_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Emoji
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.emoji, item.x, item.y + 2);
        });

        return needsUpdate ? newItems : currentItems;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [draggedItemId]);

  // Pointer Handlers
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    
    // Find clicked item (iterate backwards for z-index)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.isSorted) continue; // Lock sorted items
      const dist = Math.sqrt(Math.pow(x - item.x, 2) + Math.pow(y - item.y, 2));
      if (dist <= ITEM_RADIUS) {
        setDraggedItemId(item.id);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedItemId) return;
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    
    setItems((current) =>
      current.map((item) =>
        item.id === draggedItemId ? { ...item, x, y, targetX: x, targetY: y } : item
      )
    );
  };

  const handlePointerUp = () => {
    if (!draggedItemId) return;

    setItems((current) => {
      const item = current.find((i) => i.id === draggedItemId);
      if (!item) return current;

      // Check collision with Bins
      let droppedInGroup: Group | null = null;
      let targetBinIndex = -1;

      GROUPS.forEach((group, index) => {
        const binX = 40 + index * (BIN_WIDTH + 20);
        const binY = 30;
        if (
          item.x > binX &&
          item.x < binX + BIN_WIDTH &&
          item.y > binY &&
          item.y < binY + BIN_HEIGHT
        ) {
          droppedInGroup = group;
          targetBinIndex = index;
        }
      });

      if (droppedInGroup === item.group) {
        // Success
        setStatus(`${item.label} sorted successfully.`);
        
        // Find how many items are already in this bin to offset the new one
        const itemsInBin = current.filter((i) => i.isSorted && i.group === item.group).length;
        
        const binX = 40 + targetBinIndex * (BIN_WIDTH + 20);
        const binY = 30;
        const finalX = binX + 40 + (itemsInBin * 50);
        const finalY = binY + BIN_HEIGHT / 2;

        return current.map((i) =>
          i.id === draggedItemId
            ? { ...i, isSorted: true, targetX: finalX, targetY: finalY }
            : i
        );
      } else if (droppedInGroup) {
        // Wrong bin
        setStatus(`${item.label} does not belong in ${droppedInGroup}.`);
      }

      // Snap back to tray if missed or wrong
      const originalIndex = INITIAL_ITEMS.findIndex((i) => i.id === item.id);
      const snapX = 100 + (originalIndex * 120) % (CANVAS_WIDTH - 200);
      const snapY = CANVAS_HEIGHT - 80;
      
      return current.map((i) =>
        i.id === draggedItemId ? { ...i, targetX: snapX, targetY: snapY } : i
      );
    });

    setDraggedItemId(null);
  };

  const reset = () => {
    setItems(initializeItems());
    setDraggedItemId(null);
    setStatus('Fresh mix. Drag an item into the matching category bin.');
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.94))] shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Match & Sort</CardTitle>
          <CardDescription>Drag items from the tray and file them into the correct bucket.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {items.filter((i) => !i.isSorted).length} left
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved && <ArcadeSessionButton modeId="match-sort" score={100} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full max-w-4xl touch-none rounded-2xl bg-white/50 border border-emerald-100 shadow-inner"
        />
        
        {solved ? (
           <div className="w-full rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 font-black text-center">
             Tray Cleared! Excellent sorting.
           </div>
        ) : (
          <div className="w-full rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600 text-center">
            {status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    </Card>
  );
}
