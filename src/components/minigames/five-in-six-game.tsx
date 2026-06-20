'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { FIVE_IN_SIX_WORDS } from '@/lib/arcade/five-in-six-words';
import { cn } from '@/lib/utils';

const MAX_TRIES = 6;
const WORD_LENGTH = 5;
const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
] as const;

type LetterState = 'correct' | 'present' | 'absent' | null;
type KeyState = Exclude<LetterState, null>;

function createEmptyGuesses() {
  return Array.from({ length: MAX_TRIES }, () => Array.from({ length: WORD_LENGTH }, () => ''));
}

function createEmptyRowStates() {
  return Array.from({ length: MAX_TRIES }, () => Array.from({ length: WORD_LENGTH }, () => null as LetterState));
}

function pickTargetWord() {
  return FIVE_IN_SIX_WORDS[Math.floor(Math.random() * FIVE_IN_SIX_WORDS.length)];
}

function evaluateGuess(targetWord: string, guessWord: string): KeyState[] {
  const targetLetters = targetWord.split('');
  const rowStates: KeyState[] = Array.from({ length: WORD_LENGTH }, () => 'absent');

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guessWord[index] === targetLetters[index]) {
      rowStates[index] = 'correct';
      targetLetters[index] = '';
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (rowStates[index] === 'correct') continue;
    const matchIndex = targetLetters.indexOf(guessWord[index]);
    if (matchIndex !== -1) {
      rowStates[index] = 'present';
      targetLetters[matchIndex] = '';
    }
  }

  return rowStates;
}

function mergeKeyState(current: KeyState | undefined, next: KeyState): KeyState {
  if (current === 'correct' || next === 'correct') return 'correct';
  if (current === 'present' || next === 'present') return 'present';
  return 'absent';
}

function getScore(solvedRowIndex: number | null) {
  if (solvedRowIndex === null) return 60;
  return Math.max(125, 300 - solvedRowIndex * 35);
}

export default function FiveInSixGame() {
  const { playSfx } = useAudio();
  const [targetWord, setTargetWord] = useState(() => pickTargetWord());
  const [currentRow, setCurrentRow] = useState(0);
  const [currentTile, setCurrentTile] = useState(0);
  const [guesses, setGuesses] = useState<string[][]>(() => createEmptyGuesses());
  const [rowStates, setRowStates] = useState<LetterState[][]>(() => createEmptyRowStates());
  const [keyStates, setKeyStates] = useState<Record<string, KeyState | undefined>>({});
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [solvedRowIndex, setSolvedRowIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const triesUsed = useMemo(
    () => rowStates.filter((row) => row.some((state) => state !== null)).length,
    [rowStates]
  );
  const score = useMemo(() => getScore(solvedRowIndex), [solvedRowIndex]);

  useEffect(() => {
    if (!message || gameOver) return;
    const timeoutId = window.setTimeout(() => setMessage(''), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [gameOver, message]);

  const resetGame = () => {
    playSfx('swoosh');
    setTargetWord(pickTargetWord());
    setCurrentRow(0);
    setCurrentTile(0);
    setGuesses(createEmptyGuesses());
    setRowStates(createEmptyRowStates());
    setKeyStates({});
    setMessage('');
    setGameOver(false);
    setWon(false);
    setSolvedRowIndex(null);
    setSessionId(createArcadeSessionId());
  };

  const showMessage = (nextMessage: string) => {
    setMessage(nextMessage);
  };

  const submitGuess = () => {
    const guessWord = guesses[currentRow].join('');

    if (guessWord.length !== WORD_LENGTH) {
      playSfx('error');
      showMessage('Not enough letters');
      return;
    }

    if (!FIVE_IN_SIX_WORDS.includes(guessWord)) {
      playSfx('error');
      showMessage('Not in word list');
      return;
    }

    const nextStates = evaluateGuess(targetWord, guessWord);
    setRowStates((current) => {
      const next = current.map((row) => [...row]);
      next[currentRow] = nextStates;
      return next;
    });
    setKeyStates((current) => {
      const next = { ...current };
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        next[guessWord[index]] = mergeKeyState(current[guessWord[index]], nextStates[index]);
      }
      return next;
    });

    if (guessWord === targetWord) {
      playSfx('success');
      setGameOver(true);
      setWon(true);
      setSolvedRowIndex(currentRow);
      showMessage('Genius! You won!');
      return;
    }

    if (currentRow === MAX_TRIES - 1) {
      playSfx('error');
      setGameOver(true);
      setWon(false);
      setSolvedRowIndex(null);
      showMessage(`Game over. ${targetWord.toUpperCase()}`);
      return;
    }

    playSfx('place');
    setCurrentRow((value) => value + 1);
    setCurrentTile(0);
    showMessage('');
  };

  const handleKeyPress = (rawKey: string) => {
    if (gameOver) return;
    const key = rawKey.toLowerCase();

    if (key === 'backspace') {
      if (currentTile === 0) return;
      setGuesses((current) => {
        const next = current.map((row) => [...row]);
        next[currentRow][currentTile - 1] = '';
        return next;
      });
      setCurrentTile((value) => value - 1);
      return;
    }

    if (key === 'enter') {
      submitGuess();
      return;
    }

    if (!/^[a-z]$/.test(key) || currentTile >= WORD_LENGTH) return;

    setGuesses((current) => {
      const next = current.map((row) => [...row]);
      next[currentRow][currentTile] = key;
      return next;
    });
    setCurrentTile((value) => value + 1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[a-z]$/.test(event.key) || event.key === 'Enter' || event.key === 'Backspace') {
        event.preventDefault();
        handleKeyPress(event.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentRow, currentTile, gameOver, guesses, targetWord]);

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,247,255,0.94))] p-2 shadow-[0_20px_60px_rgba(59,130,246,0.12)] md:gap-3 md:p-4">
        <div className="ml-11 flex min-h-10 flex-wrap items-center justify-end gap-2 md:ml-0 md:min-h-9 md:flex-nowrap md:justify-between">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {triesUsed} / {MAX_TRIES}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={resetGame} aria-label="New puzzle">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Puzzle</span>
          </Button>
          {gameOver ? <ArcadeSessionStatus sessionId={sessionId} modeId="five-in-six" score={score} completed className="w-full md:w-auto" /> : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 md:gap-2.5">
          <div className="min-h-4 text-center text-[0.7rem] font-semibold text-slate-600 md:min-h-5 md:text-sm">
            {gameOver ? (won ? 'Solved.' : `Answer: ${targetWord.toUpperCase()}`) : message || 'Guess the hidden five-letter word.'}
          </div>

          <div className="mx-auto grid w-full max-w-[min(18rem,calc(100svh-22rem),calc(100vw-2.75rem))] grid-rows-6 gap-1 md:max-w-[18.5rem] md:gap-1.5">
            {guesses.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-1 md:gap-1.5">
                {row.map((letter, tileIndex) => {
                  const state = rowStates[rowIndex][tileIndex];
                  const isActiveRow = rowIndex === currentRow && !gameOver;
                  return (
                    <div
                      key={`tile-${rowIndex}-${tileIndex}`}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-lg border-2 text-[clamp(1rem,5.6vw,1.35rem)] font-black uppercase transition-colors md:rounded-xl md:text-[1.65rem]',
                        state === 'correct' && 'border-emerald-500 bg-emerald-500 text-white',
                        state === 'present' && 'border-amber-400 bg-amber-400 text-white',
                        state === 'absent' && 'border-slate-500 bg-slate-500 text-white',
                        state === null && letter && 'border-slate-400 bg-white text-slate-950',
                        state === null && !letter && isActiveRow && 'border-slate-300 bg-white/90',
                        state === null && !letter && !isActiveRow && 'border-slate-200 bg-white/65'
                      )}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mx-auto flex w-full max-w-[min(100%,22rem)] flex-col gap-1 md:max-w-xl md:gap-1.5">
            {KEYBOARD_ROWS.map((row) => (
              <div key={row.join('-')} className="flex justify-center gap-1">
                {row.map((key) => {
                  const keyState = keyStates[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeyPress(key)}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-lg border border-transparent px-1.5 text-[0.7rem] font-black uppercase shadow-sm transition-colors md:h-12 md:px-2.5 md:text-sm',
                        key === 'enter' || key === 'backspace' ? 'min-w-[3.2rem] md:min-w-[4.5rem]' : 'min-w-[1.75rem] flex-1 md:min-w-[2.35rem]',
                        keyState === 'correct' && 'bg-emerald-500 text-white',
                        keyState === 'present' && 'bg-amber-400 text-white',
                        keyState === 'absent' && 'bg-slate-500 text-white',
                        keyState === undefined && 'bg-slate-200 text-slate-950 hover:bg-slate-300'
                      )}
                    >
                      {key === 'backspace' ? 'Del' : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
