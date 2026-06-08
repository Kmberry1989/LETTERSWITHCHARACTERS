'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WHEEL_PHRASES } from '@/lib/arcade/wheel-phrases';

const WHEEL_VALUES = [150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900];
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function randomPhrase() {
  return WHEEL_PHRASES[Math.floor(Math.random() * WHEEL_PHRASES.length)];
}

function uniqueLetters(phrase: string, consonantsOnly = false) {
  const seen = new Set<string>();
  for (const char of phrase) {
    if (!/[A-Z]/.test(char)) continue;
    if (consonantsOnly && VOWELS.has(char)) continue;
    seen.add(char);
  }
  return [...seen];
}

export default function WheelGame() {
  const [round, setRound] = useState(() => randomPhrase());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [bank, setBank] = useState(0);
  const [status, setStatus] = useState('Spin the wheel.');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [guess, setGuess] = useState('');
  const [solved, setSolved] = useState(false);

  const consonantsLeft = useMemo(
    () => uniqueLetters(round.phrase, true).filter((letter) => !guessedLetters.includes(letter)),
    [guessedLetters, round.phrase],
  );

  const spinWheel = () => {
    if (solved) return;
    const nextValue = WHEEL_VALUES[Math.floor(Math.random() * WHEEL_VALUES.length)];
    setCurrentValue(nextValue);
    setStatus(`Spin landed on ${nextValue}.`);
  };

  const guessLetter = (rawLetter: string) => {
    const letter = rawLetter.trim().toUpperCase();
    if (!/^[A-Z]$/.test(letter) || solved) return;
    if (guessedLetters.includes(letter)) {
      setStatus('Already guessed.');
      return;
    }

    if (VOWELS.has(letter)) {
      if (bank < 250) {
        setStatus('Need 250 to buy a vowel.');
        return;
      }
      setBank((value) => value - 250);
    } else if (!currentValue) {
      setStatus('Spin before guessing a consonant.');
      return;
    }

    const matches = Array.from(round.phrase).filter((char) => char === letter).length;
    setGuessedLetters((value) => [...value, letter]);

    if (matches > 0) {
      if (!VOWELS.has(letter)) {
        setBank((value) => value + matches * (currentValue || 0));
      }
      setStatus(matches === 1 ? `${letter} appears once.` : `${letter} appears ${matches} times.`);
    } else {
      setStatus(`No ${letter}.`);
    }

    if (!VOWELS.has(letter)) {
      setCurrentValue(null);
    }
  };

  const solve = () => {
    if (guess.trim().toUpperCase() === round.phrase) {
      setSolved(true);
      setStatus('Solved.');
      return;
    }
    setStatus('Incorrect solve.');
  };

  const reset = () => {
    setRound(randomPhrase());
    setGuessedLetters([]);
    setBank(0);
    setStatus('Spin the wheel.');
    setCurrentValue(null);
    setGuess('');
    setSolved(false);
  };

  return (
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))] shadow-[0_20px_60px_rgba(22,163,74,0.1)]">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CardTitle className="font-headline text-3xl">Wheel</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {round.category}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {bank} pts
          </Badge>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Round
          </Button>
          {solved ? <ArcadeSessionButton modeId="wheel" score={Math.max(bank, 500)} label="Bank solve" /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6">
          <div className="mb-4 flex justify-center">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
              {Array.from(round.phrase).map((char, index) => {
                const revealed = char === ' ' || guessedLetters.includes(char) || solved;
                return (
                  <div
                    key={`${char}-${index}`}
                    className="flex h-12 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-900"
                  >
                    {revealed ? char : ''}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={spinWheel}>Spin</Button>
            <Button variant="secondary" onClick={() => guessLetter('A')}>Buy A</Button>
            <Button variant="secondary" onClick={() => guessLetter('E')}>Buy E</Button>
            <Button variant="secondary" onClick={() => guessLetter('I')}>Buy I</Button>
            <Button variant="secondary" onClick={() => guessLetter('O')}>Buy O</Button>
            <Button variant="secondary" onClick={() => guessLetter('U')}>Buy U</Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {consonantsLeft.slice(0, 16).map((letter) => (
              <Button key={letter} variant="outline" className="rounded-full px-4" onClick={() => guessLetter(letter)}>
                {letter}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={guess}
              onChange={(event) => setGuess(event.target.value.toUpperCase())}
              className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black tracking-[0.16em] text-slate-900 outline-none"
              placeholder="SOLVE THE PHRASE"
            />
            <Button onClick={solve}>Solve</Button>
          </div>
          <div className="mt-4 text-sm font-medium text-slate-600">{status}</div>
        </div>
      </CardContent>
    </Card>
  );
}
