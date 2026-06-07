'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Suit = 'hearts' | 'spades' | 'clubs' | 'diamonds';
type SolitaireCard = {
  id: string;
  rank: number;
  suit: Suit;
  x?: number;
  y?: number;
  targetX?: number;
  targetY?: number;
};

const SUITS: Suit[] = ['hearts', 'spades', 'clubs', 'diamonds'];
const MAX_RANK = 4;

// Canvas constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 350;
const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;
const CARD_RADIUS = 8;

const POSITIONS = {
  STOCK: { x: 40, y: 40 },
  WASTE: { x: 140, y: 40 },
  FOUNDATIONS: SUITS.map((_, i) => ({ x: 360 + i * (CARD_WIDTH + 20), y: 40 })),
};

function createDeck(): SolitaireCard[] {
  return Array.from({ length: MAX_RANK }, (_, i) => i + 1).flatMap((rank) =>
    SUITS.map((suit) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
    }))
  );
}

function suitSymbol(suit: Suit) {
  if (suit === 'hearts') return '♥';
  if (suit === 'diamonds') return '♦';
  if (suit === 'clubs') return '♣';
  return '♠';
}

function suitColor(suit: Suit) {
  return suit === 'hearts' || suit === 'diamonds' ? '#ef4444' : '#0f172a';
}

export default function SolitaireSprintGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stock, setStock] = useState<SolitaireCard[]>([...createDeck()].reverse());
  const [waste, setWaste] = useState<SolitaireCard[]>([]);
  const [foundations, setFoundations] = useState<Record<Suit, SolitaireCard[]>>({
    hearts: [],
    spades: [],
    clubs: [],
    diamonds: [],
  });
  
  const [draggedCard, setDraggedCard] = useState<SolitaireCard | null>(null);

  const solved = useMemo(
    () => Object.values(foundations).every((stack) => stack.length === MAX_RANK),
    [foundations]
  );

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const drawCard = (card: SolitaireCard, x: number, y: number, isFaceUp: boolean = true) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
      ctx.fill();

      // Card Body
      ctx.fillStyle = isFaceUp ? '#ffffff' : '#8b5cf6'; // Violet back
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
      ctx.fill();
      ctx.stroke();

      if (isFaceUp) {
        ctx.fillStyle = suitColor(card.suit);
        // Top Left Rank
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.rank === 1 ? 'A' : card.rank.toString(), x + 8, y + 8);
        
        // Center Suit
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(suitSymbol(card.suit), x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
      } else {
        // Pattern for card back
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 6, CARD_WIDTH - 12, CARD_HEIGHT - 12, 4);
        ctx.stroke();
      }
    };

    const drawEmptySlot = (x: number, y: number, label?: string) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      if (label) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Interpolate drag positions
      if (draggedCard) {
        draggedCard.x! += (draggedCard.targetX! - draggedCard.x!) * 0.4;
        draggedCard.y! += (draggedCard.targetY! - draggedCard.y!) * 0.4;
      }

      // Draw Stock
      if (stock.length === 0) {
        drawEmptySlot(POSITIONS.STOCK.x, POSITIONS.STOCK.y, 'RECYCLE');
      } else {
        // Draw stack effect
        for (let i = 0; i < Math.min(3, stock.length); i++) {
          drawCard(stock[0], POSITIONS.STOCK.x - i * 2, POSITIONS.STOCK.y - i * 2, false);
        }
      }

      // Draw Waste
      if (waste.length === 0) {
        drawEmptySlot(POSITIONS.WASTE.x, POSITIONS.WASTE.y);
      } else {
        // Draw card underneath if there's multiple
        if (waste.length > 1 && (!draggedCard || waste.length > 2)) {
          const underCard = waste[waste.length - (draggedCard ? 2 : 1) - 1];
          if(underCard) drawCard(underCard, POSITIONS.WASTE.x, POSITIONS.WASTE.y);
        }
        // Draw top card (unless it's currently being dragged)
        const topCard = waste[waste.length - 1];
        if (topCard && (!draggedCard || topCard.id !== draggedCard.id)) {
          drawCard(topCard, POSITIONS.WASTE.x, POSITIONS.WASTE.y);
        }
      }

      // Draw Foundations
      SUITS.forEach((suit, index) => {
        const stack = foundations[suit];
        const pos = POSITIONS.FOUNDATIONS[index];
        if (stack.length === 0) {
          drawEmptySlot(pos.x, pos.y, suitSymbol(suit));
        } else {
          drawCard(stack[stack.length - 1], pos.x, pos.y);
        }
      });

      // Draw Dragged Card on Top
      if (draggedCard && draggedCard.x !== undefined && draggedCard.y !== undefined) {
        drawCard(draggedCard, draggedCard.x, draggedCard.y);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stock, waste, foundations, draggedCard]);

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

  const isPointInRect = (px: number, py: number, rx: number, ry: number) => {
    return px >= rx && px <= rx + CARD_WIDTH && py >= ry && py <= ry + CARD_HEIGHT;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getPointerPos(e);

    // 1. Check Stock Click
    if (isPointInRect(x, y, POSITIONS.STOCK.x, POSITIONS.STOCK.y)) {
      if (stock.length === 0) {
        setStock([...waste].reverse());
        setWaste([]);
      } else {
        setWaste((current) => [...current, stock[stock.length - 1]]);
        setStock((current) => current.slice(0, -1));
      }
      return;
    }

    // 2. Check Waste Drag
    if (waste.length > 0 && isPointInRect(x, y, POSITIONS.WASTE.x, POSITIONS.WASTE.y)) {
      const topCard = waste[waste.length - 1];
      setDraggedCard({
        ...topCard,
        x: POSITIONS.WASTE.x,
        y: POSITIONS.WASTE.y,
        targetX: x - CARD_WIDTH / 2,
        targetY: y - CARD_HEIGHT / 2,
      });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedCard) return;
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    setDraggedCard((prev) => prev ? { ...prev, targetX: x - CARD_WIDTH / 2, targetY: y - CARD_HEIGHT / 2 } : null);
  };

  const handlePointerUp = () => {
    if (!draggedCard) return;

    // Check collision with foundations
    let droppedSuitIndex = -1;
    POSITIONS.FOUNDATIONS.forEach((pos, index) => {
      // Generous hit box for snapping
      if (
        draggedCard.targetX! + CARD_WIDTH / 2 > pos.x - 20 &&
        draggedCard.targetX! + CARD_WIDTH / 2 < pos.x + CARD_WIDTH + 20 &&
        draggedCard.targetY! + CARD_HEIGHT / 2 > pos.y - 20 &&
        draggedCard.targetY! + CARD_HEIGHT / 2 < pos.y + CARD_HEIGHT + 20
      ) {
        droppedSuitIndex = index;
      }
    });

    if (droppedSuitIndex !== -1) {
      const targetSuit = SUITS[droppedSuitIndex];
      const foundationStack = foundations[targetSuit];
      const expectedRank = foundationStack.length + 1;

      if (draggedCard.suit === targetSuit && draggedCard.rank === expectedRank) {
        // Valid Move
        setFoundations((current) => ({
          ...current,
          [targetSuit]: [...current[targetSuit], draggedCard],
        }));
        setWaste((current) => current.slice(0, -1));
        setDraggedCard(null);
        return;
      }
    }

    // Snap back if invalid
    setDraggedCard(null);
  };

  const reset = () => {
    setStock([...createDeck()].reverse());
    setWaste([]);
    setFoundations({ hearts: [], spades: [], clubs: [], diamonds: [] });
    setDraggedCard(null);
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,255,0.92))] shadow-[0_20px_60px_rgba(124,58,237,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Solitaire Sprint</CardTitle>
          <CardDescription>Draw through the deck. Drag cards from the waste to build up each suit (A to 4).</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">{stock.length} in stock</Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Redeal
          </Button>
          {solved && <ArcadeSessionButton modeId="solitaire" score={120} label="Bank this clear" />}
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
          className="w-full max-w-4xl touch-none rounded-2xl bg-[#e2e8f0]/40 border border-violet-200 shadow-inner"
        />
        {solved && (
           <div className="w-full rounded-[28px] border border-violet-200 bg-violet-50/90 p-5 text-violet-950 font-black text-center">
             Deck Cleared!
           </div>
        )}
      </CardContent>
    </Card>
  );
}
  const reset = () => {
    setStock([...createDeck()].reverse());
    setWaste([]);
    setFoundations({ hearts: 0, spades: 0, clubs: 0, diamonds: 0 });
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,255,0.92))] shadow-[0_20px_60px_rgba(124,58,237,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Solitaire Sprint</CardTitle>
          <CardDescription>Draw through the mini deck and build each suit from Ace to 4.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">{stock.length} in stock</Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Redeal
          </Button>
          {solved && <ArcadeSessionButton modeId="solitaire" score={120} label="Bank this clear" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Stock & Waste</div>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={drawCard}
                className="flex h-32 w-24 items-center justify-center rounded-[20px] border border-dashed border-violet-300 bg-violet-50 text-sm font-black text-violet-900"
              >
                Draw
              </button>
              <div className="flex h-32 w-24 items-center justify-center rounded-[20px] border border-slate-200 bg-white text-center shadow-sm">
                {topCard ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-slate-900">{topCard.rank}</div>
                    <div className="text-2xl">{suitSymbol(topCard.suit)}</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Waste</div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={moveToFoundation} disabled={!topCard}>
                Move To Foundation
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SUITS.map((suit) => (
              <div key={suit} className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-black capitalize text-slate-900">{suit}</div>
                  <div className="text-2xl">{suitSymbol(suit)}</div>
                </div>
                <div className="mt-6 flex h-28 items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 text-3xl font-black text-slate-900">
                  {foundations[suit]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
