'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';

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

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function shuffleDeck<T>(items: T[], seed = 42) {
  const deck = [...items];
  const random = seededRandom(seed);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function createDeck(seed = 42): SolitaireCard[] {
  return shuffleDeck(
    SUITS.flatMap((suit) =>
      Array.from({ length: 13 }, (_, offset) => ({
        id: `${suit}-${offset + 1}`,
        rank: offset + 1,
        suit,
        faceUp: false,
      }))
    ),
    seed
  );
}

function createInitialGame(seed = 42): GameState {
  const deck = createDeck(seed);
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
      className={`h-[3.7rem] w-[2.25rem] rounded-lg border px-1 py-1 shadow-sm min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] sm:h-28 sm:w-20 sm:rounded-2xl sm:px-3 sm:py-2 ${
        card.faceUp
          ? `bg-white ${active ? 'border-amber-400 ring-4 ring-amber-200' : 'border-slate-200'}`
          : 'border-slate-300 bg-[linear-gradient(135deg,#1e293b,#334155)]'
      }`}
    >
      {card.faceUp ? (
        <div className={`flex h-full flex-col justify-between ${red ? 'text-rose-600' : 'text-slate-900'}`}>
          <div className="text-[0.58rem] font-black leading-none min-[360px]:text-xs sm:text-lg">{rankLabel(card.rank)}</div>
          <div className="self-center text-sm min-[360px]:text-lg sm:text-3xl">{suitSymbol(card.suit)}</div>
          <div className="self-end text-[0.58rem] font-black leading-none min-[360px]:text-xs sm:text-lg">{rankLabel(card.rank)}</div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center rounded-[0.55rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(255,255,255,0.02))] text-[0.48rem] font-black uppercase tracking-[0.12em] text-slate-200 min-[360px]:text-[0.56rem] sm:rounded-xl sm:text-sm sm:tracking-[0.2em]">
          Deck
        </div>
      )}
    </motion.div>
  );
}

export default function SolitaireSprintGame() {
  const { playSfx } = useAudio();
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selection, setSelection] = useState<Selection>(null);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const solved = useMemo(
    () => SUITS.every((suit) => game.foundations[suit].length === 13),
    [game.foundations]
  );
  const stockCount = game.stock.length;
  const score = scoreGame(game);

  const reset = () => {
    playSfx('swoosh');
    setGame(createInitialGame(Date.now()));
    setSelection(null);
    setSessionId(createArcadeSessionId());
  };

  const drawFromStock = () => {
    playSfx('cardMove');
    setSelection(null);
    setGame((current) => {
      if (current.stock.length === 0) {
        if (current.waste.length === 0) return current;
        return {
          ...current,
          stock: current.waste.map((card) => ({ ...card, faceUp: false })).reverse(),
          waste: [],
        };
      }

      const nextStock = [...current.stock];
      const drawn = { ...nextStock.pop()!, faceUp: true };
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
    playSfx('arcadeSuccess');
    setSelection(null);
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
    playSfx('cardMove');
    setSelection(null);
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
    playSfx('arcadeSuccess');
    setSelection(null);
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
    playSfx('cardMove');
    setSelection(null);
    return true;
  };

  const handleWasteClick = () => {
    if (game.waste.length === 0) return;
    playSfx('arcadeSelect');
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
    playSfx('arcadeSelect');
    setSelection({ kind: 'tableau', columnIndex, cardIndex: resolvedCardIndex });
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(241,245,249,0.94))] p-2 shadow-[0_24px_70px_rgba(15,23,42,0.1)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {stockCount}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {score}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={reset} aria-label="New shuffle">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Shuffle</span>
          </Button>
          {solved && <ArcadeSessionStatus sessionId={sessionId} modeId="solitaire" score={300 + score} />}
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 md:gap-4">
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/85 p-2 shadow-sm md:p-5">
            <div className="flex flex-wrap justify-center gap-1.5 min-[360px]:gap-2 sm:gap-4">
              <button
                type="button"
                onClick={drawFromStock}
                className="flex h-[3.7rem] w-[2.25rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-700 min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] min-[360px]:text-[0.56rem] sm:h-28 sm:w-20 sm:rounded-2xl sm:text-xs sm:tracking-[0.18em]"
              >
                {stockCount > 0 ? 'Draw' : 'Recycle'}
              </button>

              <button type="button" onClick={handleWasteClick} className="relative h-[3.7rem] w-[2.25rem] min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] sm:h-28 sm:w-20">
                <AnimatePresence initial={false}>
                  {game.waste.length > 0 ? (
                    <CardFace card={game.waste[game.waste.length - 1]} active={selection?.kind === 'waste'} />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      className="flex h-[3.7rem] w-[2.25rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-[0.48rem] font-semibold text-slate-400 min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] min-[360px]:text-[0.56rem] sm:h-28 sm:w-20 sm:rounded-2xl sm:text-xs"
                    >
                      Waste
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {SUITS.map((suit) => {
                const topCard = game.foundations[suit][game.foundations[suit].length - 1];
                return (
                  <button
                    key={suit}
                    type="button"
                    onClick={() => handleFoundationClick(suit)}
                    className="h-[3.7rem] w-[2.25rem] min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] sm:h-28 sm:w-20"
                  >
                    {topCard ? (
                      <CardFace
                        card={{ ...topCard, faceUp: true }}
                        active={selection?.kind === 'foundation' && selection.suit === suit}
                      />
                    ) : (
                      <div className="flex h-[3.7rem] w-[2.25rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-base text-slate-300 min-[360px]:h-[4.1rem] min-[360px]:w-[2.55rem] min-[360px]:text-xl sm:h-28 sm:w-20 sm:rounded-2xl sm:text-3xl">
                        {suitSymbol(suit)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 rounded-[1.2rem] border border-slate-200 bg-white/85 p-1.5 shadow-sm md:p-5">
            <div className="grid h-full grid-cols-7 gap-1 min-[360px]:gap-1.5 sm:gap-3">
              {game.tableau.map((column, columnIndex) => (
                <button
                  key={columnIndex}
                  type="button"
                  onClick={() => handleTableauClick(columnIndex)}
                  className="relative h-full min-h-[16rem] rounded-[0.8rem] border border-dashed border-slate-200 bg-slate-50/60 p-0.5 text-left min-[360px]:min-h-[18rem] sm:min-h-[360px] sm:rounded-[22px] sm:p-2"
                >
                  {column.length === 0 ? (
                    <div className="flex h-[3.7rem] items-center justify-center rounded-lg border border-dashed border-slate-200 text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-300 min-[360px]:h-[4.1rem] min-[360px]:text-[0.56rem] sm:h-28 sm:rounded-2xl sm:text-xs sm:tracking-[0.18em]">
                      Empty
                    </div>
                  ) : (
                    column.map((card, cardIndex) => (
                      <div
                        key={card.id}
                        className="absolute left-0.5 min-[360px]:left-1 sm:left-2"
                        style={{ top: `calc(0.25rem + ${cardIndex} * clamp(0.86rem, 2.3vw, 1.75rem))` }}
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
      </div>
    </GameScreen>
  );
}
