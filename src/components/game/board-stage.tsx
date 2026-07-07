'use client';

import React from 'react';
import { useMobileGestures } from '@/components/game/mobile-gesture-context';

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const PAN_THRESHOLD_PX = 12;

type TransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

type ViewportMetrics = {
  width: number;
  height: number;
  boardSize: number;
};

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampScale(value: number) {
  return clamp(value, MIN_SCALE, MAX_SCALE);
}

function calculateBoardSize(metrics: ViewportMetrics) {
  const shortAxis = Math.min(metrics.width, metrics.height);
  const paddingFactor = shortAxis < 460 ? 0.95 : 0.97;
  return Math.max(0, Math.floor(shortAxis * paddingFactor));
}

function clampTransform(next: TransformState, metrics: ViewportMetrics): TransformState {
  if (!metrics.width || !metrics.height || !metrics.boardSize) {
    return { ...next, translateX: 0, translateY: 0 };
  }

  const scaledBoardWidth = metrics.boardSize * next.scale;
  const scaledBoardHeight = metrics.boardSize * next.scale;
  const maxOffsetX = Math.max(0, (scaledBoardWidth - metrics.width) / 2);
  const maxOffsetY = Math.max(0, (scaledBoardHeight - metrics.height) / 2);

  return {
    scale: next.scale,
    translateX: clamp(next.translateX, -maxOffsetX, maxOffsetX),
    translateY: clamp(next.translateY, -maxOffsetY, maxOffsetY),
  };
}

function getDistance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getCentroid(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export default function BoardStage({ children }: { children: React.ReactNode }) {
  const { isRackDragActive, beginBoardPan, beginBoardPinch, setBoardPan, endViewportGesture, suppressBoardTap } = useMobileGestures();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const touchPointsRef = React.useRef(new Map<number, Point>());
  const [metrics, setMetrics] = React.useState<ViewportMetrics>({ width: 0, height: 0, boardSize: 0 });
  const [transform, setTransform] = React.useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 });
  const panStateRef = React.useRef<{
    pointerId: number;
    startPoint: Point;
    startTranslateX: number;
    startTranslateY: number;
    activated: boolean;
  } | null>(null);
  const pinchStateRef = React.useRef<{
    startDistance: number;
    startScale: number;
    anchorLocal: Point;
  } | null>(null);

  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateMetrics = () => {
      const rect = element.getBoundingClientRect();
      setMetrics({
        width: rect.width,
        height: rect.height,
        boardSize: calculateBoardSize({ width: rect.width, height: rect.height, boardSize: 0 }),
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(() => {
      updateMetrics();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    setTransform((current) => clampTransform(current, metrics));
  }, [metrics]);

  const getViewportRect = React.useCallback(() => viewportRef.current?.getBoundingClientRect() ?? null, []);

  const screenToLocal = React.useCallback(
    (point: Point, currentTransform: TransformState) => {
      const rect = getViewportRect();
      if (!rect) {
        return { x: 0, y: 0 };
      }

      const centerX = rect.left + rect.width / 2 + currentTransform.translateX;
      const centerY = rect.top + rect.height / 2 + currentTransform.translateY;

      return {
        x: (point.x - centerX) / currentTransform.scale,
        y: (point.y - centerY) / currentTransform.scale,
      };
    },
    [getViewportRect]
  );

  const clearInteractionState = React.useCallback(() => {
    touchPointsRef.current.clear();
    panStateRef.current = null;
    pinchStateRef.current = null;
    endViewportGesture();
  }, [endViewportGesture]);

  const startPinch = React.useCallback(
    (currentTransform: TransformState) => {
      if (touchPointsRef.current.size < 2 || !beginBoardPinch()) {
        return;
      }

      const [first, second] = Array.from(touchPointsRef.current.values());
      const centroid = getCentroid(first, second);
      pinchStateRef.current = {
        startDistance: Math.max(getDistance(first, second), 1),
        startScale: currentTransform.scale,
        anchorLocal: screenToLocal(centroid, currentTransform),
      };
      panStateRef.current = null;
    },
    [beginBoardPinch, screenToLocal]
  );

  const continuePanWithRemainingPointer = React.useCallback((currentTransform: TransformState) => {
    if (touchPointsRef.current.size !== 1) {
      return;
    }

    const [entry] = Array.from(touchPointsRef.current.entries());
    if (!entry) {
      return;
    }

    const [pointerId, point] = entry;
    setBoardPan();
    panStateRef.current = {
      pointerId,
      startPoint: point,
      startTranslateX: currentTransform.translateX,
      startTranslateY: currentTransform.translateY,
      activated: true,
    };
  }, [setBoardPan]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || isRackDragActive) return;

    touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (touchPointsRef.current.size === 1) {
      panStateRef.current = {
        pointerId: event.pointerId,
        startPoint: { x: event.clientX, y: event.clientY },
        startTranslateX: transform.translateX,
        startTranslateY: transform.translateY,
        activated: false,
      };
      return;
    }

    if (touchPointsRef.current.size === 2) {
      startPinch(transform);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    if (!touchPointsRef.current.has(event.pointerId) || isRackDragActive) return;

    const point = { x: event.clientX, y: event.clientY };
    touchPointsRef.current.set(event.pointerId, point);

    if (touchPointsRef.current.size === 2) {
      if (!pinchStateRef.current) {
        startPinch(transform);
      }

      const pinchState = pinchStateRef.current;
      const rect = getViewportRect();
      if (!pinchState || !rect) return;

      const [first, second] = Array.from(touchPointsRef.current.values());
      const centroid = getCentroid(first, second);
      const distance = Math.max(getDistance(first, second), 1);
      const nextScale = clampScale((distance / pinchState.startDistance) * pinchState.startScale);
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const unclamped = {
        scale: nextScale,
        translateX: centroid.x - centerX - pinchState.anchorLocal.x * nextScale,
        translateY: centroid.y - centerY - pinchState.anchorLocal.y * nextScale,
      };

      event.preventDefault();
      setTransform(clampTransform(unclamped, metrics));
      return;
    }

    const panState = panStateRef.current;
    if (!panState || panState.pointerId !== event.pointerId) return;

    const deltaX = point.x - panState.startPoint.x;
    const deltaY = point.y - panState.startPoint.y;
    const movedFarEnough = Math.hypot(deltaX, deltaY) > PAN_THRESHOLD_PX;

    if (!panState.activated) {
      if (!movedFarEnough) {
        return;
      }

      if (!beginBoardPan()) {
        return;
      }
      panStateRef.current = { ...panState, activated: true };
    }

    event.preventDefault();
    setTransform(
      clampTransform(
        {
          scale: transform.scale,
          translateX: panState.startTranslateX + deltaX,
          translateY: panState.startTranslateY + deltaY,
        },
        metrics
      )
    );
  };

  const handlePointerRelease = (pointerId: number) => {
    const wasViewportGesture = Boolean(
      pinchStateRef.current || panStateRef.current?.activated || touchPointsRef.current.size > 1
    );

    touchPointsRef.current.delete(pointerId);

    if (touchPointsRef.current.size >= 2) {
      startPinch(transform);
      return;
    }

    if (pinchStateRef.current) {
      pinchStateRef.current = null;
      if (touchPointsRef.current.size === 1) {
        continuePanWithRemainingPointer(transform);
        suppressBoardTap();
        return;
      }
    }

    if (panStateRef.current?.pointerId === pointerId || touchPointsRef.current.size === 0) {
      panStateRef.current = null;
    }

    if (touchPointsRef.current.size === 0) {
      if (wasViewportGesture) {
        suppressBoardTap();
      }
      clearInteractionState();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,241,224,0.94))] p-1 shadow-[0_24px_60px_rgba(15,23,42,0.1)] touch-none sm:p-3 md:rounded-[1.75rem] md:p-4"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => handlePointerRelease(event.pointerId)}
        onPointerCancel={(event) => handlePointerRelease(event.pointerId)}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,201,71,0.14),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(191,233,255,0.16),transparent_18%),repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0_12px,rgba(255,255,255,0.05)_12px_24px)] opacity-90" />
        <div ref={viewportRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <div
            className="relative shrink-0 will-change-transform"
            style={{
              width: metrics.boardSize ? `${metrics.boardSize}px` : '100%',
              height: metrics.boardSize ? `${metrics.boardSize}px` : '100%',
              transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
              transformOrigin: 'center center',
              transition: touchPointsRef.current.size > 0 ? 'none' : 'transform 180ms ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
