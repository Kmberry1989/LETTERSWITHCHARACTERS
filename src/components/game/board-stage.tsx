'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function BoardStage({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStateRef = useRef<{ startDistance: number; startScale: number } | null>(null);
  const panStateRef = useRef<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1.08);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const zoomed = scale > 1.01;
  const maxOffset = useMemo(() => ((scale - 1) * 320) / 2, [scale]);

  const updateScale = (nextScale: number) => {
    const clampedScale = clamp(nextScale, 1, 2.4);
    setScale(clampedScale);
    setOffset((current) => ({
      x: clamp(current.x, -((clampedScale - 1) * 320) / 2, ((clampedScale - 1) * 320) / 2),
      y: clamp(current.y, -((clampedScale - 1) * 320) / 2, ((clampedScale - 1) * 320) / 2),
    }));
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    updateScale(scale - event.deltaY * 0.0015);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-board-interactive="true"]')) return;
    panStateRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current || !zoomed) return;
    setOffset({
      x: clamp(event.clientX - panStateRef.current.x, -maxOffset, maxOffset),
      y: clamp(event.clientY - panStateRef.current.y, -maxOffset, maxOffset),
    });
  };

  const stopPan = () => {
    panStateRef.current = null;
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    touchStateRef.current = {
      startDistance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      startScale: scale,
    };
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !touchStateRef.current) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    updateScale(touchStateRef.current.startScale * (distance / touchStateRef.current.startDistance));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-2 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Board Zoom</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateScale(scale - 0.12)}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-bold">{Math.round(scale * 100)}%</span>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateScale(scale + 0.12)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(255,241,224,0.94))] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.1)] touch-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          touchStateRef.current = null;
        }}
      >
        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
