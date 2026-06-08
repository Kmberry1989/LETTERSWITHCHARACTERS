'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  faceUp: boolean;
};

type Selection =
  | { kind: 'waste' }
  | { kind: 'tableau'; columnIndex: number; cardIndex: number }
  | { kind: 'foundation'; suit: Suit }
  | null;

type GameState = {
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  foundations: Record<Suit, SolitaireCard[]>;
  tableau: SolitaireCard[][];
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

function suitSymbol(suit: Suit) {
  if (suit === 'hearts') return '♥';
  if (suit === 'diamonds') return '♦';
  if (suit === 'clubs') return '♣';
  return '♠';
}

function rankLabel(rank: number) {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

function isRed(suit: Suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

function shuffleDeck<T>(items: T[]) {
  const deck = [...items];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function createDeck(): SolitaireCard[] {
  return shuffleDeck(
    SUITS.flatMap((suit) =>
      Array.from({ length: 13 }, (_, offset) => ({
        id: `${suit}-${offset + 1}`,
        rank: offset + 1,
        suit,
        faceUp: false,
      }))
    )
  );
}

function createInitialGame(): GameState {
  const deck = createDeck();
  const tableau: SolitaireCard[][] = [];
  let cursor = 0;

  for (let column = 0; column < 7; column += 1) {
    const cards = deck.slice(cursor, cursor + column + 1).map((card, index, source) => ({
      ...card,
      faceUp: index === source.length - 1,
    }));
    tableau.push(cards);
    cursor += column + 1;
  }

  return {
    stock: deck.slice(cursor),
    waste: [],
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: [],
    },
    tableau,
  };
}

function revealLastCard(cards: SolitaireCard[]) {
  if (cards.length === 0) return cards;
  const next = [...cards];
  const last = next[next.length - 1];
  if (!last.faceUp) {
    next[next.length - 1] = { ...last, faceUp: true };
  }
  return next;
}

function canMoveToFoundation(card: SolitaireCard, foundation: SolitaireCard[]) {
  if (foundation.length === 0) return card.rank === 1;
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

function canMoveToTableau(cards: SolitaireCard[], column: SolitaireCard[]) {
  const first = cards[0];
  if (!first) return false;
  const visibleTop = column[column.length - 1];
  if (!visibleTop) return first.rank === 13;
  return visibleTop.faceUp && isRed(visibleTop.suit) !== isRed(first.suit) && visibleTop.rank === first.rank + 1;
}

function scoreGame(state: GameState) {
  const foundationCount = SUITS.reduce((sum, suit) => sum + state.foundations[suit].length, 0);
  return foundationCount * 12;
}

function CardFace({
  card,
  active = false,
}: {
  card: SolitaireCard;
  active?: boolean;
}) {
  const red = isRed(card.suit);
  return (
    <motion.div
      layout
      className={`h-28 w-20 rounded-2xl border px-3 py-2 shadow-sm ${
        card.faceUp
          ? `bg-white ${active ? 'border-amber-400 ring-4 ring-amber-200' : 'border-slate-200'}`
          : 'border-slate-300 bg-[linear-gradient(135deg,#1e293b,#334155)]'
      }`}
    >
      {card.faceUp ? (
        <div className={`flex h-full flex-col justify-between ${red ? 'text-rose-600' : 'text-slate-900'}`}>
          <div className="text-lg font-black leading-none">{rankLabel(card.rank)}</div>
          <div className="self-center text-3xl">{suitSymbol(card.suit)}</div>
          <div className="self-end text-lg font-black leading-none">{rankLabel(card.rank)}</div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(255,255,255,0.02))] text-sm font-black uppercase tracking-[0.2em] text-slate-200">
          LWC
        </div>
      )}
    </motion.div>
  );
}

export default function SolitaireSprintGame() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selection, setSelection] = useState<Selection>(null);
  const [status, setStatus] = useState('Classic Klondike rules: build down in alternating colors and send Aces upward.');

  const solved = useMemo(
    () => SUITS.every((suit) => game.foundations[suit].length === 13),
    [game.foundations]
  );
  const stockCount = game.stock.length;
  const score = scoreGame(game);

  const reset = () => {
    setGame(createInitialGame());
    setSelection(null);
    setStatus('Fresh shuffle. Build foundations from Ace to King.');
  };

  const drawFromStock = () => {
    setSelection(null);
    setGame((current) => {
      if (current.stock.length === 0) {
        if (current.waste.length === 0) return current;
        setStatus('Stock recycled from waste.');
        return {
          ...current,
          stock: current.waste.map((card) => ({ ...card, faceUp: false })).reverse(),
          waste: [],
        };
      }

      const nextStock = [...current.stock];
      const drawn = { ...nextStock.pop()!, faceUp: true };
      setStatus(`Drew ${rankLabel(drawn.rank)}${suitSymbol(drawn.suit)}.`);
      return {
        ...current,
        stock: nextStock,
        waste: [...current.waste, drawn],
      };
    });
  };

  const moveWasteToFoundation = (suit: Suit) => {
    const card = game.waste[game.waste.length - 1];
    if (!card || !canMoveToFoundation(card, game.foundations[suit])) return false;

    setGame((current) => ({
      ...current,
      waste: current.waste.slice(0, -1),
      foundations: {
        ...current.foundations,
        [suit]: [...current.foundations[suit], card],
      },
    }));
    setSelection(null);
    setStatus(`Moved ${rankLabel(card.rank)}${suitSymbol(card.suit)} to foundation.`);
    return true;
  };

  const moveWasteToTableau = (columnIndex: number) => {
    const card = game.waste[game.waste.length - 1];
    if (!card || !canMoveToTableau([card], game.tableau[columnIndex])) return false;

    setGame((current) => {
      const nextTableau = current.tableau.map((column) => [...column]);
      nextTableau[columnIndex].push(card);
      return {
        ...current,
        waste: current.waste.slice(0, -1),
        tableau: nextTableau,
      };
    });
    setSelection(null);
    setStatus(`Placed ${rankLabel(card.rank)}${suitSymbol(card.suit)} on tableau.`);
    return true;
  };

  const moveTableauToFoundation = (columnIndex: number, suit: Suit) => {
    const column = game.tableau[columnIndex];
    const card = column[column.length - 1];
    if (!card?.faceUp || !canMoveToFoundation(card, game.foundations[suit])) return false;

    setGame((current) => {
      const nextTableau = current.tableau.map((entry) => [...entry]);
      const moved = nextTableau[columnIndex].pop()!;
      nextTableau[columnIndex] = revealLastCard(nextTableau[columnIndex]);
      return {
        ...current,
        tableau: nextTableau,
        foundations: {
          ...current.foundations,
          [suit]: [...current.foundations[suit], moved],
        },
      };
    });
    setSelection(null);
    setStatus(`Sent ${rankLabel(card.rank)}${suitSymbol(card.suit)} upward.`);
    return true;
  };

  const moveTableauStack = (fromColumnIndex: number, fromCardIndex: number, toColumnIndex: number) => {
    const movingCards = game.tableau[fromColumnIndex].slice(fromCardIndex);
    if (!movingCards.every((card) => card.faceUp) || !canMoveToTableau(movingCards, game.tableau[toColumnIndex])) {
      return false;
    }

    setGame((current) => {
      const nextTableau = current.tableau.map((entry) => [...entry]);
      nextTableau[fromColumnIndex] = revealLastCard(nextTableau[fromColumnIndex].slice(0, fromCardIndex));
      nextTableau[toColumnIndex].push(...movingCards);
      return {
        ...current,
        tableau: nextTableau,
      };
    });
    setSelection(null);
    setStatus(`Moved a ${movingCards.length}-card run.`);
    return true;
  };

  const handleWasteClick = () => {
    if (game.waste.length === 0) return;
    setSelection((current) => (current?.kind === 'waste' ? null : { kind: 'waste' }));
  };

  const handleFoundationClick = (suit: Suit) => {
    if (selection?.kind === 'waste') {
      if (moveWasteToFoundation(suit)) return;
    }
    if (selection?.kind === 'tableau') {
      if (moveTableauToFoundation(selection.columnIndex, suit)) return;
    }
    setSelection({ kind: 'foundation', suit });
  };

  const handleTableauClick = (columnIndex: number, cardIndex?: number) => {
    if (selection?.kind === 'waste') {
      if (moveWasteToTableau(columnIndex)) return;
    }
    if (selection?.kind === 'tableau') {
      if (selection.columnIndex === columnIndex && selection.cardIndex === (cardIndex ?? game.tableau[columnIndex].length - 1)) {
        setSelection(null);
        return;
      }
      if (moveTableauStack(selection.columnIndex, selection.cardIndex, columnIndex)) return;
    }

    const column = game.tableau[columnIndex];
    const resolvedCardIndex = cardIndex ?? column.length - 1;
    const card = column[resolvedCardIndex];
    if (!card?.faceUp) return;
    setSelection({ kind: 'tableau', columnIndex, cardIndex: resolvedCardIndex });
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(241,245,249,0.94))] shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Solitaire Sprint</CardTitle>
          <CardDescription>Now a full shuffle-and-build solitaire loop, tuned for fast arcade sessions.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stockCount} in stock
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Score {score}
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Shuffle
          </Button>
          {solved && <ArcadeSessionButton modeId="solitaire" score={300 + score} label="Bank this win" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Stock, Waste, Foundations</div>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={drawFromStock}
                className="flex h-28 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
              >
                {stockCount > 0 ? 'Draw' : 'Recycle'}
              </button>

              <button type="button" onClick={handleWasteClick} className="relative h-28 w-20">
                <AnimatePresence initial={false}>
                  {game.waste.length > 0 ? (
                    <CardFace card={game.waste[game.waste.length - 1]} active={selection?.kind === 'waste'} />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      className="flex h-28 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400"
                    >
                      Waste
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {SUITS.map((suit) => {
                const topCard = game.foundations[suit][game.foundations[suit].length - 1];
                return (
                  <button key={suit} type="button" onClick={() => handleFoundationClick(suit)} className="h-28 w-20">
                    {topCard ? (
                      <CardFace
                        card={{ ...topCard, faceUp: true }}
                        active={selection?.kind === 'foundation' && selection.suit === suit}
                      />
                    ) : (
                      <div className="flex h-28 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-3xl text-slate-300">
                        {suitSymbol(suit)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Tableau</div>
            <div className="mt-4 grid grid-cols-7 gap-3">
              {game.tableau.map((column, columnIndex) => (
                <button
                  key={columnIndex}
                  type="button"
                  onClick={() => handleTableauClick(columnIndex)}
                  className="relative min-h-[360px] rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 p-2 text-left"
                >
                  {column.length === 0 ? (
                    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                      Empty
                    </div>
                  ) : (
                    column.map((card, cardIndex) => (
                      <div
                        key={card.id}
                        className="absolute left-2"
                        style={{ top: `${cardIndex * 28 + 8}px` }}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleTableauClick(columnIndex, cardIndex);
                        }}
                      >
                        <CardFace
                          card={card}
                          active={
                            selection?.kind === 'tableau' &&
                            selection.columnIndex === columnIndex &&
                            selection.cardIndex === cardIndex
                          }
                        />
                      </div>
                    ))
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">{status}</div>
      </CardContent>
    </Card>
  );
}
