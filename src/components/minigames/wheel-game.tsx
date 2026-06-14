'use client';

import { useMemo, useRef, useState } from 'react';
import { RefreshCcw, Users } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WHEEL_PHRASES } from '@/lib/arcade/wheel-phrases';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

const WHEEL_VALUES = [150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900];
const WHEEL_COLORS = ['#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#F59E0B', '#F97316'];
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type WheelPlayer = {
  uid: string;
  displayName: string;
  score: number;
};

export type WheelGameDocument = {
  players: string[];
  playerData: Record<string, WheelPlayer>;
  currentTurn: string;
  phrase: string;
  category: string;
  guessedLetters: string[];
  currentValue: number | null;
  status: 'active' | 'solved';
  spinState: { velocity: number; resultIndex: number | null; resultValue: number | null };
  round: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type PointerSample = {
  x: number;
  y: number;
  time: number;
};

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

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const round = (value: number) => Number(value.toFixed(3));
  return {
    x: round(cx + radius * Math.cos(angle)),
    y: round(cy + radius * Math.sin(angle)),
  };
}

function wedgePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function playTone(frequency: number, duration = 0.08, type: OscillatorType = 'sine') {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function getSpinVelocity(samples: PointerSample[]) {
  if (samples.length < 2) return 0;
  const recent = samples.slice(-5);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max(16, last.time - first.time);
  const distance = Math.hypot(last.x - first.x, last.y - first.y);
  return Math.min(1, distance / elapsed / 1.7);
}

export default function WheelGame() {
  const pointerSamples = useRef<PointerSample[]>([]);
  const [round, setRound] = useState(() => WHEEL_PHRASES[0]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [bank, setBank] = useState(0);
  const [status, setStatus] = useState('Flick the wheel.');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [guess, setGuess] = useState('');
  const [solved, setSolved] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [duelMode, setDuelMode] = useState(false);
  const [activePlayer, setActivePlayer] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const phraseRows = useMemo(() => round.phrase.split(' '), [round.phrase]);
  const phraseLetters = useMemo(() => new Set(uniqueLetters(round.phrase)), [round.phrase]);
  const consonantsLeft = useMemo(
    () => uniqueLetters(round.phrase, true).filter((letter) => !guessedLetters.includes(letter)),
    [guessedLetters, round.phrase],
  );
  const canSpin = !spinning && !solved && consonantsLeft.length > 0;

  const endTurn = () => {
    if (duelMode) setActivePlayer((player) => (player === 0 ? 1 : 0));
  };

  const spinWheel = (velocity = 0.55) => {
    if (!canSpin) return;
    const extraTurns = 2 + Math.round(velocity * 5);
    const resultIndex = Math.floor((Date.now() / 97 + velocity * 100) % WHEEL_VALUES.length);
    const segmentDegrees = 360 / WHEEL_VALUES.length;
    const targetRotation = rotation + extraTurns * 360 + resultIndex * segmentDegrees + segmentDegrees / 2;
    const result = WHEEL_VALUES[resultIndex];

    setSpinning(true);
    setCurrentValue(null);
    setStatus(velocity > 0.7 ? 'Hard flick.' : 'Wheel spinning.');
    setRotation(targetRotation);

    let ticks = 0;
    const tickTimer = window.setInterval(() => {
      ticks += 1;
      playTone(420 + (ticks % 4) * 50, 0.025, 'square');
      if (ticks >= 12 + Math.round(velocity * 12)) window.clearInterval(tickTimer);
    }, 70);

    window.setTimeout(() => {
      setCurrentValue(result);
      setStatus(`Landed on ${result}. Pick a consonant.`);
      setSpinning(false);
      playTone(660, 0.12, 'triangle');
    }, 980 + velocity * 520);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    pointerSamples.current = [{ x: event.clientX, y: event.clientY, time: performance.now() }];
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    pointerSamples.current = [...pointerSamples.current.slice(-7), { x: event.clientX, y: event.clientY, time: performance.now() }];
  };

  const handlePointerUp = () => {
    const velocity = getSpinVelocity(pointerSamples.current);
    pointerSamples.current = [];
    spinWheel(Math.max(0.28, velocity));
  };

  const guessLetter = (letter: string) => {
    if (solved || spinning || guessedLetters.includes(letter)) return;
    const isVowel = VOWELS.has(letter);
    if (!isVowel && !currentValue) {
      setStatus('Flick first.');
      return;
    }
    if (isVowel && bank < 250) {
      setStatus('Need 250 for a vowel.');
      return;
    }

    setGuessedLetters((current) => [...current, letter]);
    const matches = Array.from(round.phrase).filter((char) => char === letter).length;

    if (!matches) {
      setStatus(`No ${letter}.`);
      setCurrentValue(null);
      endTurn();
      playTone(180, 0.16, 'sawtooth');
      return;
    }

    const points = isVowel ? -250 : matches * (currentValue || 0);
    setBank((value) => Math.max(0, value + points));
    if (duelMode) {
      setScores((current) => current.map((score, index) => (index === activePlayer ? Math.max(0, score + points) : score)));
    }
    setCurrentValue(null);
    setStatus(matches === 1 ? `${letter} appears once.` : `${letter} appears ${matches} times.`);
    playTone(720, 0.1, 'triangle');
  };

  const solve = () => {
    if (guess.trim().toUpperCase() !== round.phrase) {
      setStatus('Incorrect solve.');
      endTurn();
      playTone(180, 0.16, 'sawtooth');
      return;
    }
    setSolved(true);
    setStatus('Solved.');
    playTone(880, 0.18, 'triangle');
  };

  const reset = () => {
    setRound(randomPhrase());
    setGuessedLetters([]);
    setBank(0);
    setStatus('Flick the wheel.');
    setCurrentValue(null);
    setGuess('');
    setSolved(false);
    setRotation(0);
    setSpinning(false);
    setActivePlayer(0);
    setScores([0, 0]);
    setSessionId(createArcadeSessionId());
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))] p-2 shadow-[0_20px_60px_rgba(22,163,74,0.1)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <h1 className="hidden font-headline text-3xl font-black md:block">Wheel Duel</h1>
          <Badge variant="secondary" className="rounded-full px-3 py-1">{duelMode ? `P${activePlayer + 1}` : round.category}</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">{duelMode ? `${scores[0]}-${scores[1]}` : bank}</Badge>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setDuelMode((value) => !value)} aria-label="Toggle duel">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={reset} aria-label="New round">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Round</span>
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="wheel" score={Math.max(bank, 500)} /> : null}
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-2 md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-1 md:gap-6">
          <div className="flex items-center justify-center rounded-[1.4rem] border border-white/70 bg-white/90 p-2 md:p-6">
            <button
              type="button"
              className="relative aspect-square w-[min(52vw,11.5rem)] touch-none md:w-full md:max-w-[17.5rem]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={() => {
                if (pointerSamples.current.length === 0) spinWheel(0.45);
              }}
              disabled={!canSpin}
              style={{ touchAction: 'none' }}
              aria-label="Flick wheel"
            >
              <div className="absolute left-1/2 top-[-2px] z-20 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-slate-950 md:border-l-[18px] md:border-r-[18px] md:border-b-[26px]" />
              <svg viewBox="0 0 280 280" className="h-full w-full transition-transform ease-out" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? '1300ms' : '200ms' }}>
                {WHEEL_VALUES.map((value, index) => {
                  const segmentAngle = (Math.PI * 2) / WHEEL_VALUES.length;
                  const startAngle = -Math.PI / 2 + index * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const labelAngle = startAngle + segmentAngle / 2;
                  const label = polarPoint(140, 140, 92, labelAngle);
                  return (
                    <g key={value}>
                      <path d={wedgePath(140, 140, 126, startAngle, endAngle)} fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} />
                      <text x={label.x} y={label.y} fill="white" fontSize="16" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(labelAngle * 180) / Math.PI + 90} ${label.x} ${label.y})`}>
                        {value}
                      </text>
                    </g>
                  );
                })}
                <circle cx="140" cy="140" r="42" fill="#0F172A" />
                <text x="140" y="140" fill="white" fontSize="13" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                  FLICK
                </text>
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-col gap-2 rounded-[1.4rem] border border-white/70 bg-white/90 p-2 md:p-5">
            <div className="flex flex-col items-center gap-1">
              {phraseRows.map((row, rowIndex) => (
                <div key={`${row}-${rowIndex}`} className="flex flex-wrap justify-center gap-1">
                  {Array.from(row).map((char, index) => {
                    const revealed = guessedLetters.includes(char) || solved;
                    return (
                      <div key={`${row}-${char}-${index}`} className="flex h-8 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-900 min-[360px]:h-9 min-[360px]:w-7 md:h-14 md:w-10 md:text-lg">
                        {revealed ? char : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-9 gap-1 md:grid-cols-7 md:gap-2">
              {ALPHABET.map((letter) => {
                const isVowel = VOWELS.has(letter);
                const disabled = solved || spinning || guessedLetters.includes(letter) || (isVowel ? bank < 250 : !currentValue);
                return (
                  <Button key={letter} variant={isVowel ? 'secondary' : 'outline'} size="sm" className={cn('h-7 rounded-full px-0 text-xs md:h-9 md:px-3', guessedLetters.includes(letter) && 'opacity-40')} onClick={() => guessLetter(letter)} disabled={disabled}>
                    {letter}
                  </Button>
                );
              })}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={guess}
                onChange={(event) => setGuess(event.target.value.toUpperCase())}
                className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black tracking-[0.12em] text-slate-900 outline-none md:text-sm"
                placeholder="SOLVE"
              />
              <Button onClick={solve} size="sm">Solve</Button>
            </div>
            <div className="min-h-5 text-center text-xs font-semibold text-slate-600 md:text-sm">
              {currentValue ? `${currentValue}: ${status}` : status}
            </div>
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
