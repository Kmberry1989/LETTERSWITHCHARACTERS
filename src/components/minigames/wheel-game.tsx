'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { BookOpen, Coins, Users } from 'lucide-react';
import { GameModeHeader, GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { WHEEL_PHRASES } from '@/lib/arcade/wheel-phrases';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

const WHEEL_VALUES = [150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900];
const WHEEL_COLORS = ['#0F766E', '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#CA8A04'];
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const INCORRECT_SOLVE_PENALTY = 500;

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

type SpinGesture = {
  strength: number;
  direction: 1 | -1;
  angularVelocity: number;
};

const SEGMENT_DEGREES = 360 / WHEEL_VALUES.length;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeAngleDelta(delta: number) {
  if (delta > Math.PI) return delta - Math.PI * 2;
  if (delta < -Math.PI) return delta + Math.PI * 2;
  return delta;
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

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

export function getWheelGesture(samples: PointerSample[], center: { x: number; y: number }): SpinGesture {
  if (samples.length < 2) return { strength: 0.5, direction: 1, angularVelocity: 0 };
  const recent = samples.slice(-8);
  let angularDistance = 0;
  for (let index = 1; index < recent.length; index += 1) {
    const previous = Math.atan2(recent[index - 1].y - center.y, recent[index - 1].x - center.x);
    const current = Math.atan2(recent[index].y - center.y, recent[index].x - center.x);
    angularDistance += normalizeAngleDelta(current - previous);
  }
  const elapsed = Math.max(16, recent[recent.length - 1].time - recent[0].time);
  const angularVelocity = angularDistance / elapsed;
  const direction: 1 | -1 = angularVelocity < 0 ? -1 : 1;
  const strength = clamp(Math.abs(angularVelocity) / 0.012, 0.22, 1);
  return { strength, direction, angularVelocity };
}

export function getWheelResultIndex(rotation: number) {
  const normalizedRotation = positiveModulo(rotation, 360);
  return positiveModulo(Math.round((-SEGMENT_DEGREES / 2 - normalizedRotation) / SEGMENT_DEGREES), WHEEL_VALUES.length);
}

export function getWheelSolveBonus(phrase: string, guessedLetters: string[]) {
  const unrevealedUniqueLetters = uniqueLetters(phrase).filter((letter) => !guessedLetters.includes(letter)).length;
  return 1000 + unrevealedUniqueLetters * 250;
}

function snapRotationToResult(projectedRotation: number, resultIndex: number) {
  const targetWithinTurn = positiveModulo(-SEGMENT_DEGREES / 2 - resultIndex * SEGMENT_DEGREES, 360);
  const turn = Math.round((projectedRotation - targetWithinTurn) / 360);
  return turn * 360 + targetWithinTurn;
}

export default function WheelGame() {
  const { playSfx } = useAudio();
  const pointerSamples = useRef<PointerSample[]>([]);
  const wheelCenter = useRef({ x: 0, y: 0 });
  const [round, setRound] = useState(() => WHEEL_PHRASES[0]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [bank, setBank] = useState(0);
  const [status, setStatus] = useState('Swipe the wheel or press Spin.');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [guess, setGuess] = useState('');
  const [solved, setSolved] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinDuration, setSpinDuration] = useState(1300);
  const [spinning, setSpinning] = useState(false);
  const [duelMode, setDuelMode] = useState(false);
  const [activePlayer, setActivePlayer] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const phraseRows = useMemo(() => round.phrase.split(' '), [round.phrase]);
  const phraseLetters = useMemo(() => new Set(uniqueLetters(round.phrase)), [round.phrase]);
  const solveBonus = useMemo(() => getWheelSolveBonus(round.phrase, guessedLetters), [guessedLetters, round.phrase]);
  const consonantsLeft = useMemo(
    () => uniqueLetters(round.phrase, true).filter((letter) => !guessedLetters.includes(letter)),
    [guessedLetters, round.phrase],
  );
  const canSpin = !spinning && !solved && !currentValue && consonantsLeft.length > 0;

  const endTurn = () => {
    if (duelMode) setActivePlayer((player) => (player === 0 ? 1 : 0));
  };

  const spinWheel = ({ strength = 0.55, direction = 1 }: Partial<SpinGesture> = {}) => {
    if (!canSpin) return;
    const resolvedStrength = clamp(strength, 0.22, 1);
    const resolvedDirection: 1 | -1 = direction === -1 ? -1 : 1;
    const extraTurns = 2 + resolvedStrength * 4.35;
    const projectedRotation = rotation + resolvedDirection * extraTurns * 360;
    const resultIndex = getWheelResultIndex(projectedRotation);
    let targetRotation = snapRotationToResult(projectedRotation, resultIndex);
    if (resolvedDirection > 0 && targetRotation <= rotation) targetRotation += 360;
    if (resolvedDirection < 0 && targetRotation >= rotation) targetRotation -= 360;
    const result = WHEEL_VALUES[resultIndex];
    const duration = Math.round(950 + resolvedStrength * 850);

    setSpinning(true);
    setCurrentValue(null);
    setStatus(resolvedStrength > 0.72 ? 'Strong spin!' : 'Wheel spinning.');
    setSpinDuration(duration);
    setRotation(targetRotation);
    playSfx('wheelSpin');

    let ticks = 0;
    const tickTimer = window.setInterval(() => {
      ticks += 1;
      playSfx('wheelTick');
      if (ticks >= 12 + Math.round(resolvedStrength * 12)) window.clearInterval(tickTimer);
    }, 70);

    window.setTimeout(() => {
      setCurrentValue(result);
      setStatus('Pick a consonant.');
      setSpinning(false);
      playSfx('wheelLand');
    }, duration);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    wheelCenter.current = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    pointerSamples.current = [{ x: event.clientX, y: event.clientY, time: performance.now() }];
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    pointerSamples.current = [...pointerSamples.current.slice(-7), { x: event.clientX, y: event.clientY, time: performance.now() }];
  };

  const handlePointerUp = () => {
    const gesture = getWheelGesture(pointerSamples.current, wheelCenter.current);
    pointerSamples.current = [];
    spinWheel(gesture);
  };

  const guessLetter = (letter: string) => {
    if (solved || spinning || guessedLetters.includes(letter)) return;
    const isVowel = VOWELS.has(letter);
    if (!isVowel && !currentValue) {
      playSfx('arcadeError');
      setStatus('Spin first.');
      return;
    }
    if (isVowel && bank < 250) {
      playSfx('arcadeError');
      setStatus('Need 250 for a vowel.');
      return;
    }

    setGuessedLetters((current) => [...current, letter]);
    const matches = Array.from(round.phrase).filter((char) => char === letter).length;

    if (!matches) {
      setStatus(`No ${letter}.`);
      setCurrentValue(null);
      endTurn();
      playSfx('arcadeError');
      return;
    }

    const points = isVowel ? -250 : matches * (currentValue || 0);
    setBank((value) => Math.max(0, value + points));
    if (duelMode) {
      setScores((current) => current.map((score, index) => (index === activePlayer ? Math.max(0, score + points) : score)));
    }
    setCurrentValue(null);
    setStatus(matches === 1 ? `${letter} appears once.` : `${letter} appears ${matches} times.`);
    playSfx('arcadeSuccess');
  };

  const solve = () => {
    if (guess.trim().toUpperCase() !== round.phrase) {
      setBank((value) => Math.max(0, value - INCORRECT_SOLVE_PENALTY));
      if (duelMode) {
        setScores((current) => current.map((score, index) => (index === activePlayer ? Math.max(0, score - INCORRECT_SOLVE_PENALTY) : score)));
      }
      setStatus(`Incorrect solve. ${INCORRECT_SOLVE_PENALTY} point penalty.`);
      endTurn();
      playSfx('arcadeError');
      return;
    }
    setBank((value) => value + solveBonus);
    if (duelMode) {
      setScores((current) => current.map((score, index) => (index === activePlayer ? score + solveBonus : score)));
    }
    setSolved(true);
    setStatus(`Solved! Early-solve bonus: ${solveBonus.toLocaleString()} points.`);
    playSfx('success');
  };

  const reset = () => {
    playSfx('swoosh');
    setRound(randomPhrase());
    setGuessedLetters([]);
    setBank(0);
    setStatus('Swipe the wheel or press Spin.');
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
      <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.6rem] border border-indigo-200/40 bg-[radial-gradient(circle_at_50%_-15%,rgba(250,204,21,0.2),transparent_34%),radial-gradient(circle_at_8%_74%,rgba(45,212,191,0.16),transparent_28%),linear-gradient(145deg,#18204b_0%,#25245d_48%,#152c4b_100%)] p-2 shadow-[0_28px_80px_rgba(30,41,90,0.3)] md:gap-4 md:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1"><GameModeHeader modeId="wheel" statLabel={duelMode ? `Player ${activePlayer + 1}` : 'Bank'} statValue={duelMode ? `${scores[0]}-${scores[1]}` : bank} onRestart={reset} hasProgress={bank > 0 || guessedLetters.length > 0} /></div>
          <Button variant="outline" className="h-11 rounded-full border-white/60 bg-white/90 px-3 shadow-lg" onClick={() => setDuelMode((value) => !value)} aria-label={`Switch to ${duelMode ? 'solo' : 'duel'} mode`} aria-pressed={duelMode}>
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{duelMode ? 'Duel' : 'Solo'}</span>
          </Button>
        </div>
        {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="wheel" score={Math.max(bank, 500)} outcome="completed" onPlayAgain={reset} /> : null}

        <div className="relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 md:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.35fr)] md:grid-rows-1 md:gap-4">
          <div className="relative flex items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/20 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.16),rgba(11,18,51,0.58)_68%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] md:p-5">
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-amber-200/50 bg-slate-950/45 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
              <Coins className="h-3.5 w-3.5" /> {currentValue ? `${currentValue} per letter` : 'Spin value'}
            </div>
            <button
              type="button"
              className="relative mt-5 aspect-square w-[min(62vw,14.5rem)] touch-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-amber-300 md:mt-0 md:w-full md:max-w-[21rem]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { pointerSamples.current = []; }}
              onClick={(event) => { if (event.detail === 0) spinWheel(); }}
              disabled={!canSpin}
              style={{ touchAction: 'none' }}
              aria-label="Spin wheel. Swipe clockwise or counterclockwise; faster gestures create stronger spins."
            >
              <div className="pointer-events-none absolute left-1/2 top-[-5px] z-30 -translate-x-1/2 drop-shadow-[0_5px_4px_rgba(0,0,0,0.45)]" aria-hidden="true">
                <div className="h-0 w-0 border-l-[15px] border-r-[15px] border-t-[26px] border-l-transparent border-r-transparent border-t-amber-300 md:border-l-[20px] md:border-r-[20px] md:border-t-[34px]" />
                <div className="absolute left-1/2 top-[-5px] h-3 w-5 -translate-x-1/2 rounded-full border-2 border-amber-100 bg-amber-600 md:h-4 md:w-7" />
              </div>
              <div className="absolute inset-0 rounded-full border-[7px] border-amber-200/90 shadow-[0_0_0_4px_rgba(120,53,15,0.55),0_0_30px_rgba(250,204,21,0.35),inset_0_0_18px_rgba(15,23,42,0.55)]" />
              <svg viewBox="0 0 280 280" className="h-full w-full rounded-full p-[7px] transition-transform ease-out" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? `${spinDuration}ms` : '200ms' }}>
                {WHEEL_VALUES.map((value, index) => {
                  const segmentAngle = (Math.PI * 2) / WHEEL_VALUES.length;
                  const startAngle = -Math.PI / 2 + index * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const labelAngle = startAngle + segmentAngle / 2;
                  const label = polarPoint(140, 140, 92, labelAngle);
                  return (
                    <g key={value}>
                      <path d={wedgePath(140, 140, 126, startAngle, endAngle)} fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" />
                      <text x={label.x} y={label.y} fill="white" fontSize="15" fontWeight="900" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(labelAngle * 180) / Math.PI + 90} ${label.x} ${label.y})`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                        {value}
                      </text>
                    </g>
                  );
                })}
                <circle cx="140" cy="140" r="43" fill="#111827" stroke="#FDE68A" strokeWidth="4" />
                <text x="140" y="140" fill="#FEF3C7" fontSize="14" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                  SPIN
                </text>
              </svg>
            </button>
            <div className="pointer-events-none absolute bottom-2 right-2 hidden h-24 w-24 opacity-80 md:block">
              <Image src="/tiles/parrot_tile.png" alt="Parrot feather prize tile" fill sizes="96px" className="object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]" />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-[1.5rem] border border-white/25 bg-white/95 p-2 shadow-[0_18px_42px_rgba(8,15,45,0.25)] md:gap-3 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.2em] text-amber-100">
                <BookOpen className="h-3.5 w-3.5" /> {round.category}
              </div>
              <div className="text-xs font-black text-slate-500">{guessedLetters.length} guessed</div>
            </div>

            <div className="flex min-h-[5.1rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] border border-indigo-900/10 bg-[linear-gradient(180deg,#203267,#172450)] px-2 py-3 shadow-inner md:min-h-[8rem]">
              {phraseRows.map((row, rowIndex) => (
                <div key={`${row}-${rowIndex}`} className="flex flex-wrap justify-center gap-1">
                  {Array.from(row).map((char, index) => {
                    const revealed = guessedLetters.includes(char) || solved;
                    return (
                      <div key={`${row}-${char}-${index}`} className="flex h-8 w-6 items-center justify-center rounded-md border border-white/55 bg-[linear-gradient(180deg,#fffef2,#e7f5ee)] text-sm font-black text-indigo-950 shadow-[0_2px_0_rgba(8,15,45,0.35)] min-[360px]:h-9 min-[360px]:w-7 md:h-12 md:w-9 md:text-lg">
                        {revealed ? char : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-9 gap-1 rounded-[1rem] bg-slate-100 p-1.5 md:grid-cols-7 md:gap-1.5 md:p-2">
              {ALPHABET.map((letter) => {
                const isVowel = VOWELS.has(letter);
                const disabled = solved || spinning || guessedLetters.includes(letter) || (isVowel ? bank < 250 : !currentValue);
                return (
                  <Button key={letter} variant={isVowel ? 'secondary' : 'outline'} size="sm" className={cn('h-7 rounded-lg border-slate-200 px-0 text-xs font-black disabled:opacity-35 md:h-9 md:px-3', isVowel && 'bg-amber-100 text-amber-950 hover:bg-amber-200', guessedLetters.includes(letter) && 'opacity-30')} onClick={() => guessLetter(letter)} disabled={disabled} aria-label={`${letter}${isVowel ? ', vowel costs 250' : ''}`}>
                    {letter}
                  </Button>
                );
              })}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={guess}
                onChange={(event) => setGuess(event.target.value.toUpperCase())}
                className="min-w-0 rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 text-xs font-black tracking-[0.12em] text-slate-900 outline-none focus:border-indigo-400 md:text-sm"
                placeholder="TYPE THE PHRASE"
                aria-label="Solve the phrase"
              />
              <Button onClick={solve} size="sm" className="rounded-xl bg-indigo-700 hover:bg-indigo-800">Solve</Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[0.68rem] font-bold text-amber-950 md:text-xs">
              <span>Solve now: <strong>+{solveBonus.toLocaleString()}</strong></span>
              <span className="text-amber-800/80">Wrong: −{INCORRECT_SOLVE_PENALTY}</span>
            </div>
            <div className={cn('min-h-7 rounded-xl px-3 py-1.5 text-center text-xs font-black md:text-sm', currentValue ? 'bg-amber-100 text-amber-950' : 'bg-emerald-50 text-emerald-900')} role="status" aria-live="polite">
              {status}
            </div>
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
