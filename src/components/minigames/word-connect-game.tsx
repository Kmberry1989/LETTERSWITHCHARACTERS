'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Puzzle = {
  letters: string[];
  acceptedWords: string[];
  targetCount: number;
};

export default function WordConnectGame() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const currentWord = useMemo(
    () => path.map((index) => puzzle?.letters[index] || '').join(''),
    [path, puzzle],
  );
  const solved = foundWords.length >= (puzzle?.targetCount || 0);

  const loadPuzzle = async () => {
    setLoading(true);
    setPath([]);
    setFoundWords([]);
    setStatus('');

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

  const submitWord = async () => {
    if (!puzzle) return;
    if (currentWord.length < 3) {
      setStatus('Use at least 3 letters.');
      return;
    }
    if (foundWords.includes(currentWord)) {
      setStatus('Already banked.');
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
        setStatus('Not in the playable dictionary.');
        return;
      }

      if (!puzzle.acceptedWords.includes(currentWord)) {
        setStatus('This wheel does not support that word.');
        return;
      }

      setFoundWords((current) => [...current, currentWord]);
      setPath([]);
      setStatus('Locked in.');
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
        <CardContent className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(254,242,242,0.92))] shadow-[0_20px_60px_rgba(251,113,133,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CardTitle className="font-headline text-3xl">Word Connect</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {foundWords.length} / {puzzle.targetCount}
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={() => void loadPuzzle()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Wheel
          </Button>
          {solved ? <ArcadeSessionButton modeId="word-connect" score={foundWords.length * 25} label="Bank this board" /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto flex max-w-xl items-center justify-center rounded-[36px] border border-rose-100 bg-white/85 p-6 shadow-sm">
          <div className="relative h-[320px] w-[320px]">
            <div className="absolute inset-[64px] rounded-full border border-dashed border-rose-200 bg-[radial-gradient(circle,rgba(255,241,242,0.8),rgba(255,255,255,0.15))]" />
            {puzzle.letters.map((letter, index) => {
              const active = path.includes(index);
              const angle = (Math.PI * 2 * index) / puzzle.letters.length - Math.PI / 2;
              const radius = 118;
              const left = 160 + Math.cos(angle) * radius;
              const top = 160 + Math.sin(angle) * radius;
              return (
                <button
                  key={`${letter}-${index}`}
                  type="button"
                  onClick={() => toggleLetter(index)}
                  className={`absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-2xl font-black transition-all ${
                    active
                      ? 'border-rose-400 bg-rose-500 text-white shadow-lg shadow-rose-200'
                      : 'border-rose-100 bg-rose-50 text-rose-900 hover:scale-105'
                  }`}
                  style={{ left, top }}
                >
                  {letter}
                </button>
              );
            })}
            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl">
              Build
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="text-4xl font-black tracking-[0.22em] text-slate-900">{currentWord || '...'}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void submitWord()}>Submit</Button>
            <Button variant="secondary" onClick={() => setPath([])}>
              Clear
            </Button>
          </div>
          {status ? <div className="mt-4 text-sm text-slate-600">{status}</div> : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap gap-2">
            {foundWords.length > 0 ? (
              foundWords.map((word) => (
                <Badge key={word} className="rounded-full bg-slate-950 px-3 py-1.5 text-white hover:bg-slate-950">
                  {word}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-slate-500">No words banked yet.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
