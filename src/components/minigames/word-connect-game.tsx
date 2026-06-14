'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createArcadeSessionId } from '@/lib/arcade/session-id';

type Puzzle = {
  letters: string[];
  acceptedWords: string[];
  targetCount: number;
};

const MIN_WORD_LENGTH = 3;

function buildLetterCounts(letters: string[]) {
  return letters.reduce<Record<string, number>>((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
}

export default function WordConnectGame() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const currentWord = useMemo(
    () => path.map((index) => puzzle?.letters[index] || '').join(''),
    [path, puzzle],
  );
  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const acceptedSet = useMemo(() => new Set(puzzle?.acceptedWords || []), [puzzle]);
  const solved = foundWords.length >= (puzzle?.targetCount || 0);

  const loadPuzzle = async () => {
    setLoading(true);
    setPath([]);
    setFoundWords([]);
    setStatus('');
    setSessionId(createArcadeSessionId());

    try {
      const response = await fetch('/api/arcade/word-connect', { cache: 'no-store' });
      const nextPuzzle = await response.json();
      setPuzzle(nextPuzzle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPuzzle();
  }, []);

  const toggleLetter = (index: number) => {
    setPath((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));
  };

  const clearPath = () => {
    setPath([]);
    setStatus('');
  };

  const submitWord = async () => {
    if (!puzzle) return;
    if (currentWord.length < MIN_WORD_LENGTH) {
      setStatus(`Use at least ${MIN_WORD_LENGTH} letters.`);
      return;
    }
    if (foundSet.has(currentWord)) {
      setStatus('Already found.');
      return;
    }

    const availableCounts = buildLetterCounts(puzzle.letters);
    const usedCounts = buildLetterCounts(currentWord.split(''));
    const exceedsLetterSupply = Object.entries(usedCounts).some(
      ([letter, count]) => count > (availableCounts[letter] || 0),
    );

    if (exceedsLetterSupply) {
      setStatus('That word uses letters not available on this wheel.');
      return;
    }

    try {
      const response = await fetch('/api/arcade/validate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: currentWord }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.isValid) {
        setStatus(result?.reason || 'Not in the playable dictionary.');
        return;
      }

      if (!acceptedSet.has(currentWord)) {
        setStatus('That word cannot be made from this wheel.');
        return;
      }

      setFoundWords((current) => [...current, currentWord]);
      setPath([]);
      setStatus(foundWords.length + 1 >= puzzle.targetCount ? 'Wheel cleared.' : 'Locked in.');
    } catch {
      setStatus('Validation failed.');
    }
  };

  if (loading || !puzzle) {
    return (
      <GameScreen>
        <div className="mt-12 h-full animate-pulse rounded-[28px] bg-white/80 md:mt-0" />
      </GameScreen>
    );
  }

  const center = 50;
  const radius = puzzle.letters.length <= 5 ? 35 : 37;
  const letterSize = puzzle.letters.length <= 5 ? 22 : 20;

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(254,242,242,0.92))] p-2 shadow-[0_20px_60px_rgba(251,113,133,0.12)] md:gap-5 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {foundWords.length} / {puzzle.targetCount}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={() => void loadPuzzle()} aria-label="New wheel">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Wheel</span>
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="word-connect" score={foundWords.length * 25} /> : null}
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 md:gap-5">
        <div className="mx-auto flex w-full max-w-[min(100%,calc(100svh-12rem))] touch-none items-center justify-center rounded-[1.5rem] border border-rose-100 bg-white/85 p-2 shadow-sm md:max-w-xl md:p-6" style={{ touchAction: 'none' }}>
          <div className="relative aspect-square w-full max-w-[18rem] md:max-w-[20rem]">
            <div className="absolute inset-[20%] rounded-full border border-dashed border-rose-200 bg-[radial-gradient(circle,rgba(255,241,242,0.8),rgba(255,255,255,0.15))]" />
            {puzzle.letters.map((letter, index) => {
              const active = path.includes(index);
              const angle = (Math.PI * 2 * index) / puzzle.letters.length - Math.PI / 2;
              const left = center + Math.cos(angle) * radius;
              const top = center + Math.sin(angle) * radius;
              return (
                <button
                  key={`${letter}-${index}`}
                  type="button"
                  onClick={() => toggleLetter(index)}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-black transition-all ${
                    active
                      ? 'border-rose-400 bg-rose-500 text-white shadow-lg shadow-rose-200'
                      : 'border-rose-100 bg-rose-50 text-rose-900 hover:scale-105'
                  }`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${letterSize}%`,
                    height: `${letterSize}%`,
                    fontSize: 'clamp(1.05rem, 5vw, 1.75rem)',
                    touchAction: 'none',
                  }}
                >
                  {letter}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => void submitWord()}
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-[0.62rem] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 min-[360px]:text-xs"
              style={{ width: '30%', height: '30%' }}
              disabled={currentWord.length < MIN_WORD_LENGTH}
            >
              Build
            </button>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/70 bg-white/90 p-3 shadow-sm md:p-5">
          <div className="break-all text-xl font-black tracking-[0.14em] text-slate-900 md:text-4xl">{currentWord || '...'}</div>
          <div className="mt-2 flex flex-wrap gap-2 md:mt-4 md:gap-3">
            <Button variant="secondary" size="sm" onClick={clearPath}>
              Clear
            </Button>
          </div>
          {status ? <div className="mt-2 text-xs text-slate-600 md:mt-4 md:text-sm">{status}</div> : null}
        </div>

        <div className="min-h-0 rounded-[1.4rem] border border-slate-200 bg-white/80 p-3 md:p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:mb-4 md:text-sm">Found words</div>
          <div className="flex max-h-16 flex-wrap gap-1 overflow-hidden md:max-h-none md:gap-2">
            {foundWords.length > 0 ? (
              foundWords.map((word) => (
                <Badge key={word} className="rounded-full bg-slate-950 px-2 py-1 text-[0.62rem] text-white hover:bg-slate-950 md:px-3 md:py-1.5 md:text-xs">
                  {word}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-slate-500">No words found yet.</div>
            )}
          </div>
        </div>
        </div>
      </div>
    </GameScreen>
  );
}
