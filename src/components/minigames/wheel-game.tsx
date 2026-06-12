'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WHEEL_PHRASES } from '@/lib/arcade/wheel-phrases';
import { cn } from '@/lib/utils';

const WHEEL_VALUES = [150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900];
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WHEEL_COLORS = ['#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#F59E0B', '#F97316'];

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

function describeSpin(value: number | null) {
  return value ? `Spin landed on ${value}.` : 'Spin the wheel.';
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function wedgePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export default function WheelGame() {
  const [round, setRound] = useState(() => randomPhrase());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [bank, setBank] = useState(0);
  const [status, setStatus] = useState('Spin the wheel.');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [guess, setGuess] = useState('');
  const [solved, setSolved] = useState(false);
  const [spinIndex, setSpinIndex] = useState<number | null>(null);

  const consonantsLeft = useMemo(
    () => uniqueLetters(round.phrase, true).filter((letter) => !guessedLetters.includes(letter)),
    [guessedLetters, round.phrase],
  );
  const phraseLetters = useMemo(() => new Set(uniqueLetters(round.phrase)), [round.phrase]);
  const canSpin = !solved && consonantsLeft.length > 0;
  const wheelRotation = spinIndex === null ? 0 : 1080 + spinIndex * (360 / WHEEL_VALUES.length);

  const spinWheel = () => {
    if (!canSpin) return;
    const nextIndex = Math.floor(Math.random() * WHEEL_VALUES.length);
    const nextValue = WHEEL_VALUES[nextIndex];
    setSpinIndex(nextIndex);
    setCurrentValue(nextValue);
    setStatus(describeSpin(nextValue));
  };

  const guessLetter = (rawLetter: string) => {
    const letter = rawLetter.trim().toUpperCase();
    if (!/^[A-Z]$/.test(letter) || solved) return;
    if (guessedLetters.includes(letter)) {
      setStatus('Already guessed.');
      return;
    }
    if (!phraseLetters.has(letter)) {
      setStatus(`No ${letter}.`);
      if (!VOWELS.has(letter)) {
        setCurrentValue(null);
      }
      setGuessedLetters((value) => [...value, letter]);
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

    if (!VOWELS.has(letter)) {
      setBank((value) => value + matches * (currentValue || 0));
      setCurrentValue(null);
    }

    setStatus(matches === 1 ? `${letter} appears once.` : `${letter} appears ${matches} times.`);
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
    setSpinIndex(null);
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
          {currentValue ? (
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              spin {currentValue}
            </Badge>
          ) : null}
          <Button variant="outline" className="rounded-full" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Round
          </Button>
          {solved ? <ArcadeSessionButton modeId="wheel" score={Math.max(bank, 500)} label="Bank solve" /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6">
            <div className="mb-5 flex justify-center">
              <div className="relative h-[280px] w-[280px]">
                <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-l-[18px] border-r-[18px] border-t-0 border-b-[26px] border-l-transparent border-r-transparent border-b-slate-950" />
                <svg
                  viewBox="0 0 280 280"
                  className="h-full w-full transition-transform duration-700 ease-out"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  {WHEEL_VALUES.map((value, index) => {
                    const segmentAngle = (Math.PI * 2) / WHEEL_VALUES.length;
                    const startAngle = -Math.PI / 2 + index * segmentAngle;
                    const endAngle = startAngle + segmentAngle;
                    const labelAngle = startAngle + segmentAngle / 2;
                    const label = polarPoint(140, 140, 92, labelAngle);
                    return (
                      <g key={value}>
                        <path d={wedgePath(140, 140, 126, startAngle, endAngle)} fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} />
                        <text
                          x={label.x}
                          y={label.y}
                          fill="white"
                          fontSize="16"
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${(labelAngle * 180) / Math.PI + 90} ${label.x} ${label.y})`}
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="140" cy="140" r="40" fill="#0F172A" />
                  <text x="140" y="140" fill="white" fontSize="14" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
                    SPIN
                  </text>
                </svg>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={spinWheel} disabled={!canSpin}>
                Spin Wheel
              </Button>
            </div>
          </div>

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

            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {ALPHABET.map((letter) => {
                const isVowel = VOWELS.has(letter);
                const guessed = guessedLetters.includes(letter);
                const inPhrase = phraseLetters.has(letter);
                const disabled = guessed || solved || (isVowel ? bank < 250 : !currentValue);
                return (
                  <Button
                    key={letter}
                    variant={isVowel ? 'secondary' : 'outline'}
                    className={cn(
                      'rounded-full px-3',
                      guessed && 'border-slate-200 bg-slate-100 text-slate-400',
                      !guessed && inPhrase && 'border-emerald-300'
                    )}
                    onClick={() => guessLetter(letter)}
                    disabled={disabled}
                  >
                    {letter}
                  </Button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
