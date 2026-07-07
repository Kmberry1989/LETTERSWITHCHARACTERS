'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type MobileGestureOwner = 'idle' | 'rack-drag' | 'board-pan' | 'board-pinch';

type MobileGestureContextValue = {
  owner: MobileGestureOwner;
  isRackDragActive: boolean;
  isViewportGestureActive: boolean;
  beginRackDrag: () => boolean;
  endRackDrag: () => void;
  beginBoardPan: () => boolean;
  beginBoardPinch: () => boolean;
  setBoardPan: () => void;
  endViewportGesture: () => void;
  suppressBoardTap: (durationMs?: number) => void;
  shouldSuppressBoardTap: () => boolean;
};

const MobileGestureContext = createContext<MobileGestureContextValue | undefined>(undefined);

export function MobileGestureProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<MobileGestureOwner>('idle');
  const ownerRef = useRef<MobileGestureOwner>('idle');
  const boardTapSuppressUntilRef = useRef(0);
  const setOwnerState = useCallback((nextOwner: MobileGestureOwner) => {
    ownerRef.current = nextOwner;
    setOwner(nextOwner);
  }, []);

  const beginRackDrag = useCallback(() => {
    if (ownerRef.current !== 'idle') {
      return false;
    }
    setOwnerState('rack-drag');
    return true;
  }, [setOwnerState]);

  const endRackDrag = useCallback(() => {
    if (ownerRef.current === 'rack-drag') {
      setOwnerState('idle');
    }
  }, [setOwnerState]);

  const beginBoardPan = useCallback(() => {
    if (ownerRef.current === 'rack-drag' || ownerRef.current === 'board-pinch') {
      return false;
    }
    setOwnerState('board-pan');
    return true;
  }, [setOwnerState]);

  const beginBoardPinch = useCallback(() => {
    if (ownerRef.current === 'rack-drag') {
      return false;
    }
    setOwnerState('board-pinch');
    return true;
  }, [setOwnerState]);

  const setBoardPan = useCallback(() => {
    if (ownerRef.current !== 'rack-drag') {
      setOwnerState('board-pan');
    }
  }, [setOwnerState]);

  const endViewportGesture = useCallback(() => {
    if (ownerRef.current === 'board-pan' || ownerRef.current === 'board-pinch') {
      setOwnerState('idle');
    }
  }, [setOwnerState]);

  const suppressBoardTap = useCallback((durationMs = 180) => {
    boardTapSuppressUntilRef.current = Date.now() + durationMs;
  }, []);

  const shouldSuppressBoardTap = useCallback(() => Date.now() < boardTapSuppressUntilRef.current, []);

  const value = useMemo<MobileGestureContextValue>(
    () => ({
      owner,
      isRackDragActive: owner === 'rack-drag',
      isViewportGestureActive: owner === 'board-pan' || owner === 'board-pinch',
      beginRackDrag,
      endRackDrag,
      beginBoardPan,
      beginBoardPinch,
      setBoardPan,
      endViewportGesture,
      suppressBoardTap,
      shouldSuppressBoardTap,
    }),
    [owner, beginRackDrag, endRackDrag, beginBoardPan, beginBoardPinch, setBoardPan, endViewportGesture, suppressBoardTap, shouldSuppressBoardTap]
  );

  return <MobileGestureContext.Provider value={value}>{children}</MobileGestureContext.Provider>;
}

export function useMobileGestures() {
  const context = useContext(MobileGestureContext);
  if (!context) {
    throw new Error('useMobileGestures must be used within a MobileGestureProvider.');
  }
  return context;
}
