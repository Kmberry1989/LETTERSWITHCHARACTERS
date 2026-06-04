'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LETTERS = ['S', 'T', 'A', 'R', 'E', 'N'];
const VALID_WORDS = ['STAR', 'STARE', 'RATE', 'TEAR', 'EARN', 'NEAR'];

export default function WordConnectGame() {
  const [path, setPath] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [status, setStatus] = useState('Find four words from the wheel.');
  const solved = foundWords.length >= 4;

  const currentWord = useMemo(() => path.map((index) => LETTERS[index]).join(''), [path]);

  const toggleLetter = (index: number) => {
    setPath((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));
  };

  const submitWord = () => {
    if (currentWord.length < 3) {
      setStatus('Use at least 3 letters.');
      return;
    }
    if (!VALID_WORDS.includes(currentWord)) {
      setStatus(`"${currentWord}" is not on today’s board.`);
      return;
    }
    if (foundWords.includes(currentWord)) {
      setStatus(`"${currentWord}" is already banked.`);
      return;
    }
    setFoundWords((current) => [...current, currentWord]);
    setStatus(`Nice. "${currentWord}" locked in.`);
    setPath([]);
  };

  const reset = () => {
    setPath([]);
    setFoundWords([]);
    setStatus('Fresh wheel. Find four words from the wheel.');
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(254,242,242,0.92))] shadow-[0_20px_60px_rgba(251,113,133,0.12)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="font-headline text-3xl">Word Connect</CardTitle>
          <CardDescription>Build a chain by tapping letters. Four valid words completes today’s target.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {foundWords.length} / 4 words
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {solved && <ArcadeSessionButton modeId="word-connect" score={foundWords.length * 25} label="Bank this board" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-4 rounded-[32px] border border-rose-100 bg-white/85 p-6 shadow-sm">
          {LETTERS.map((letter, index) => {
            const active = path.includes(index);
            return (
              <button
                key={`${letter}-${index}`}
                type="button"
                onClick={() => toggleLetter(index)}
                className={`flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-black transition-all ${
                  active
                    ? 'border-rose-400 bg-rose-500 text-white shadow-lg shadow-rose-200'
                    : 'border-rose-100 bg-rose-50 text-rose-900 hover:-translate-y-1'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Current Chain</div>
          <div className="mt-3 text-4xl font-black tracking-[0.22em] text-slate-900">{currentWord || '...'}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={submitWord}>Submit Word</Button>
            <Button variant="secondary" onClick={() => setPath([])}>
              Clear Chain
            </Button>
          </div>
          <div className="mt-4 text-sm text-slate-600">{status}</div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Found Words</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {foundWords.length === 0 ? (
              <span className="text-sm text-slate-500">Nothing banked yet.</span>
            ) : (
              foundWords.map((word) => (
                <Badge key={word} className="rounded-full bg-slate-950 px-3 py-1.5 text-white hover:bg-slate-950">
                  {word}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
