'use client';

import React from 'react';

function clampScale(value: number) {
  return Math.min(Math.max(value, 1), 2.4);
}

export default function BoardStage({ children }: { children: React.ReactNode }) {
  const [boardScale, setBoardScale] = React.useState(1);
  const touchPointsRef = React.useRef(new Map<number, { x: number; y: number }>());
  const pinchStateRef = React.useRef<{ startDistance: number; startScale: number } | null>(null);

  const updatePinchState = React.useCallback(() => {
    if (touchPointsRef.current.size !== 2) {
      pinchStateRef.current = null;
      return;
    }

    const [first, second] = Array.from(touchPointsRef.current.values());
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    pinchStateRef.current = {
      startDistance: Math.hypot(dx, dy),
      startScale: boardScale,
    };
  }, [boardScale]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPointsRef.current.size === 2) {
      updatePinchState();
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    if (!touchPointsRef.current.has(event.pointerId)) return;

    touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPointsRef.current.size !== 2 || !pinchStateRef.current) return;

    const [first, second] = Array.from(touchPointsRef.current.values());
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0 || pinchStateRef.current.startDistance <= 0) return;

    event.preventDefault();
    setBoardScale(clampScale((distance / pinchStateRef.current.startDistance) * pinchStateRef.current.startScale));
  };

  const clearPointer = (pointerId: number) => {
    touchPointsRef.current.delete(pointerId);
    if (touchPointsRef.current.size < 2) {
      pinchStateRef.current = null;
      return;
    }
    updatePinchState();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,241,224,0.94))] p-1 shadow-[0_24px_60px_rgba(15,23,42,0.1)] touch-none sm:p-3 md:rounded-[1.75rem] md:p-4"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => clearPointer(event.pointerId)}
        onPointerCancel={(event) => clearPointer(event.pointerId)}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,201,71,0.14),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(191,233,255,0.16),transparent_18%),repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0_12px,rgba(255,255,255,0.05)_12px_24px)] opacity-90" />
        <div className="mx-auto flex h-full max-h-full max-w-full items-center justify-center overflow-hidden">
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `scale(${boardScale})`,
              transformOrigin: 'center center',
              transition: touchPointsRef.current.size === 2 ? 'none' : 'transform 160ms ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
