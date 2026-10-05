'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Check, RotateCcw, ShieldCheck, Undo2 } from 'lucide-react';
import BoardChrome from '@/components/game/board-chrome';
import GameBoard from '@/components/game/game-board';
import { MobileGestureProvider } from '@/components/game/mobile-gesture-context';
import { ThemedTileFace } from '@/components/game/themed-tile-face';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/game/types';
import {
  addDemoBotMove,
  buildDemoPendingTiles,
  commitDemoOpening,
  getDemoWord,
  isDemoOpeningMove,
  LOCAL_DEMO_RACK,
} from '@/lib/local-bot-demo';

type DemoPhase = 'player-turn' | 'bot-thinking' | 'complete';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

export function LocalBotDemo() {
  const [phase, setPhase] = useState<DemoPhase>('player-turn');
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [board, setBoard] = useState<Record<string, Tile>>({});
  const [message, setMessage] = useState('Tap C, A, and T to place CAT across the center star.');
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTiles = useMemo(() => buildDemoPendingTiles(selectedIndexes), [selectedIndexes]);
  const currentWord = getDemoWord(selectedIndexes);

  const finishBotTurn = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    botTimerRef.current = null;
    setBoard((current) => addDemoBotMove(current));
    setPhase('complete');
    setMessage('Bitty Botty added S to make CATS. Match complete — you win 10 to 6!');
  }, []);

  const resetDemo = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    botTimerRef.current = null;
    setPhase('player-turn');
    setSelectedIndexes([]);
    setBoard({});
    setMessage('Tap C, A, and T to place CAT across the center star.');
  }, []);

  useEffect(() => () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      mode: 'single-player',
      persistence: 'none',
      rewards: 'disabled',
      credentialsRequired: false,
      phase,
      instruction: message,
      currentWord,
      selectedRackIndexes: selectedIndexes,
      pendingTiles: pendingTiles.map(({ row, col, letter }) => ({ row, col, letter })),
      board: Object.fromEntries(Object.entries(board).map(([position, tile]) => [position, tile.letter])),
      scores: { player: phase === 'player-turn' ? 0 : 10, bot: phase === 'complete' ? 6 : 0 },
      coordinateSystem: '15x15 board; origin is top-left; rows increase down and columns increase right',
    });
    window.advanceTime = (ms: number) => {
      if (phase === 'bot-thinking' && ms >= 1) finishBotTurn();
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [board, currentWord, finishBotTurn, message, pendingTiles, phase, selectedIndexes]);

  const selectTile = (index: number) => {
    if (phase !== 'player-turn' || selectedIndexes.includes(index) || selectedIndexes.length >= 3) return;
    const next = [...selectedIndexes, index];
    setSelectedIndexes(next);
    setMessage(next.length === 3 ? (isDemoOpeningMove(next) ? 'CAT is ready. Play the word.' : 'That opening is not CAT. Recall and try C, A, T.') : `Building ${getDemoWord(next)}…`);
  };

  const playWord = () => {
    if (!isDemoOpeningMove(selectedIndexes)) {
      setMessage('This guided match opens with CAT. Recall and tap C, A, T.');
      return;
    }
    setBoard(commitDemoOpening(pendingTiles));
    setSelectedIndexes([]);
    setPhase('bot-thinking');
    setMessage('CAT scores 10. Bitty Botty is choosing a local move…');
    botTimerRef.current = setTimeout(finishBotTurn, 650);
  };

  return (
    <main className="game-screen-pattern min-h-[100svh] bg-[#fff7eb] px-3 py-4 sm:px-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <header className="rounded-2xl border border-amber-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700"><ShieldCheck className="h-4 w-4" /> Single Player</div>
              <h1 className="mt-1 font-headline text-2xl text-slate-900 sm:text-3xl">You vs. Bitty Botty</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">A private match you can play without signing in. It stays on this device and does not use berries, rewards, or online progress.</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link href="/">Back to sign in</Link></Button>
          </div>
        </header>

        <section aria-label="Single-player scores" className="grid grid-cols-[1fr_auto_1fr] items-center rounded-2xl border border-white/70 bg-white/85 px-4 py-2 text-center shadow-sm">
          <div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">You</div><div data-testid="demo-player-score" className="text-2xl font-black text-emerald-700">{phase === 'player-turn' ? 0 : 10}</div></div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{phase === 'player-turn' ? 'Your turn' : phase === 'bot-thinking' ? 'Bot turn' : 'Complete'}</div>
          <div><div className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500"><Bot className="h-3.5 w-3.5" /> Bitty Botty</div><div data-testid="demo-bot-score" className="text-2xl font-black text-violet-700">{phase === 'complete' ? 6 : 0}</div></div>
        </section>

        <div className="mx-auto w-full max-w-[min(76svh,46rem)]">
          <MobileGestureProvider>
            <div className="aspect-square overflow-hidden rounded-[1.2rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,241,224,0.94))] p-1 shadow-[0_24px_60px_rgba(15,23,42,0.1)] sm:p-3 md:rounded-[1.75rem] md:p-4">
              <BoardChrome boardThemeId="board-green">
                <GameBoard placedTiles={board} pendingTiles={pendingTiles} tileSetId="tile-minimalist" ownerTileSetIds={{ 'local-demo-player': 'tile-minimalist', 'bitty-botty-demo': 'tile-minimalist' }} />
              </BoardChrome>
            </div>
          </MobileGestureProvider>
        </div>

        <section className="rounded-2xl border-2 border-[#a07e56] bg-[#c4a27a] p-2 shadow-sm sm:p-3">
          <p role="status" aria-live="polite" data-testid="demo-status" className="mb-2 rounded-xl bg-white/90 px-3 py-2 text-center text-sm font-semibold text-slate-800">{message}</p>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Single-player tile rack">
            {LOCAL_DEMO_RACK.map((tile, index) => {
              const selected = selectedIndexes.includes(index);
              const unavailable = phase !== 'player-turn' || selected;
              return (
                <button key={`${tile.letter}-${index}`} type="button" aria-label={`Tile ${tile.letter}, ${tile.score} point${tile.score === 1 ? '' : 's'}`} aria-pressed={selected} disabled={unavailable} onClick={() => selectTile(index)} data-testid={`demo-tile-${tile.letter.toLowerCase()}`} className={cn('aspect-square min-w-0 rounded-lg border-b-4 border-black/20 bg-[#f8e8c7] p-1 shadow-md transition-[box-shadow,opacity] hover:shadow-lg disabled:cursor-default', selected && 'opacity-30 shadow-none')}>
                  <ThemedTileFace tileSetId="tile-minimalist" letter={tile.letter} score={tile.score} interactive={!unavailable} showScore />
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {phase === 'complete' ? (
              <Button onClick={resetDemo} className="col-span-2"><RotateCcw className="mr-2 h-4 w-4" /> Play again</Button>
            ) : (
              <>
                <Button variant="secondary" disabled={phase !== 'player-turn' || selectedIndexes.length === 0} onClick={() => { setSelectedIndexes([]); setMessage('Tap C, A, and T to place CAT across the center star.'); }}><Undo2 className="mr-2 h-4 w-4" /> Recall</Button>
                <Button disabled={phase !== 'player-turn' || selectedIndexes.length === 0} onClick={playWord}><Check className="mr-2 h-4 w-4" /> Play {currentWord || 'word'}</Button>
              </>
            )}
          </div>
        </section>

        <p className="pb-3 text-center text-xs font-medium text-slate-600">Single-player session only. Closing or refreshing resets the match, and nothing is sent to online game or economy services.</p>
      </div>
    </main>
  );
}
