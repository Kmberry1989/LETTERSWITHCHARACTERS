'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader>
          <CardTitle>Word Connect</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] animate-pulse rounded-[28px] bg-slate-100 sm:h-[420px]" />
      </Card>
    );
  }

  const center = 50;
  const radius = puzzle.letters.length <= 5 ? 35 : 37;
  const letterSize = puzzle.letters.length <= 5 ? 22 : 20;

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(254,242,242,0.92))] shadow-[0_20px_60px_rgba(251,113,133,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CardTitle className="font-headline text-3xl">Word Connect</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {foundWords.length} / {puzzle.targetCount}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Find {puzzle.targetCount} easy words
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={() => void loadPuzzle()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Wheel
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="word-connect" score={foundWords.length * 25} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-[36px] border border-rose-100 bg-white/85 p-4 shadow-sm sm:p-6">
          <div className="relative aspect-square w-full max-w-[20rem]">
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

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="break-all text-2xl font-black tracking-[0.18em] text-slate-900 min-[360px]:text-3xl sm:text-4xl">{currentWord || '...'}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={clearPath}>
              Clear
            </Button>
          </div>
          {status ? <div className="mt-4 text-sm text-slate-600">{status}</div> : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Found words</div>
          <div className="flex flex-wrap gap-2">
            {foundWords.length > 0 ? (
              foundWords.map((word) => (
                <Badge key={word} className="rounded-full bg-slate-950 px-3 py-1.5 text-white hover:bg-slate-950">
                  {word}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-slate-500">No words found yet.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
