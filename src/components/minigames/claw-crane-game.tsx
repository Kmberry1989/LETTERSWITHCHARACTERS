'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Target, Trophy } from 'lucide-react';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameScreen } from '@/components/game-screen';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type Prize = {
  id: string;
  name: string;
  value: number;
  accent: string;
  glow: string;
};

const LANE_COUNT = 5;
const SWEEP_MIN = 0.12;
const SWEEP_MAX = 0.88;
const SWEEP_STEP = 0.016;

const INITIAL_LANES: Prize[][] = [
  [
    { id: 'berry-bear', name: 'Berry Bear', value: 70, accent: 'linear-gradient(180deg,#fb7185 0%,#ec4899 100%)', glow: 'rgba(244,114,182,0.24)' },
    { id: 'mint-frog', name: 'Mint Frog', value: 55, accent: 'linear-gradient(180deg,#6ee7b7 0%,#10b981 100%)', glow: 'rgba(16,185,129,0.24)' },
  ],
  [
    { id: 'sun-cat', name: 'Sun Cat', value: 65, accent: 'linear-gradient(180deg,#fcd34d 0%,#f59e0b 100%)', glow: 'rgba(245,158,11,0.24)' },
    { id: 'cloud-whale', name: 'Cloud Whale', value: 40, accent: 'linear-gradient(180deg,#7dd3fc 0%,#38bdf8 100%)', glow: 'rgba(56,189,248,0.24)' },
  ],
  [
    { id: 'lilac-bun', name: 'Lilac Bun', value: 90, accent: 'linear-gradient(180deg,#c4b5fd 0%,#8b5cf6 100%)', glow: 'rgba(139,92,246,0.24)' },
    { id: 'peach-puff', name: 'Peach Puff', value: 60, accent: 'linear-gradient(180deg,#fdba74 0%,#fb7185 100%)', glow: 'rgba(251,113,133,0.2)' },
    { id: 'sea-otter', name: 'Sea Otter', value: 45, accent: 'linear-gradient(180deg,#93c5fd 0%,#2563eb 100%)', glow: 'rgba(37,99,235,0.22)' },
  ],
  [
    { id: 'lime-dino', name: 'Lime Dino', value: 50, accent: 'linear-gradient(180deg,#bef264 0%,#84cc16 100%)', glow: 'rgba(132,204,22,0.22)' },
  ],
  [
    { id: 'starlight-fox', name: 'Starlight Fox', value: 85, accent: 'linear-gradient(180deg,#fde68a 0%,#f97316 100%)', glow: 'rgba(249,115,22,0.24)' },
    { id: 'bubble-ram', name: 'Bubble Ram', value: 55, accent: 'linear-gradient(180deg,#bfdbfe 0%,#6366f1 100%)', glow: 'rgba(99,102,241,0.22)' },
  ],
];

function cloneLanes(lanes: Prize[][]) {
  return lanes.map((lane) => [...lane]);
}

export default function ClawCraneGame() {
  const { playSfx } = useAudio();
  const [lanes, setLanes] = useState<Prize[][]>(() => cloneLanes(INITIAL_LANES));
  const [clawPosition, setClawPosition] = useState(0.5);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [dropDepth, setDropDepth] = useState(0);
  const [phase, setPhase] = useState<'aim' | 'drop' | 'grab' | 'rise' | 'done'>('aim');
  const [message, setMessage] = useState('Time the claw and drop over the tallest stack you want to grab.');
  const [capturedPrize, setCapturedPrize] = useState<Prize | null>(null);
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const targetLane = useMemo(() => {
    const normalized = (clawPosition - SWEEP_MIN) / (SWEEP_MAX - SWEEP_MIN);
    return Math.min(LANE_COUNT - 1, Math.max(0, Math.round(normalized * (LANE_COUNT - 1))));
  }, [clawPosition]);

  const totalPrizes = lanes.reduce((total, lane) => total + lane.length, 0);
  const finished = phase === 'done';

  useEffect(() => {
    if (phase !== 'aim') {
      return;
    }

    const interval = window.setInterval(() => {
      setClawPosition((value) => {
        const next = value + SWEEP_STEP * direction;
        if (next >= SWEEP_MAX) {
          setDirection(-1);
          return SWEEP_MAX;
        }
        if (next <= SWEEP_MIN) {
          setDirection(1);
          return SWEEP_MIN;
        }
        return next;
      });
    }, 32);

    return () => window.clearInterval(interval);
  }, [direction, phase]);

  const reset = () => {
    playSfx('swoosh');
    setLanes(cloneLanes(INITIAL_LANES));
    setClawPosition(0.5);
    setDirection(1);
    setAttemptsLeft(3);
    setDropDepth(0);
    setPhase('aim');
    setMessage('Time the claw and drop over the tallest stack you want to grab.');
    setCapturedPrize(null);
    setScore(0);
    setSessionId(createArcadeSessionId());
  };

  const finishRun = (nextScore: number, prize: Prize | null, attemptsRemaining: number, nextPrizeCount: number) => {
    setScore(nextScore);
    setCapturedPrize(prize);
    setDropDepth(0);
    if (prize) {
      setPhase('done');
      setMessage(`${prize.name} secured. Prize bay closed.`);
      return;
    }
    if (attemptsRemaining <= 0 || nextPrizeCount === 0) {
      setPhase('done');
      setMessage(nextPrizeCount === 0 ? 'Machine cleared out.' : 'No grabs left. Reset for a new cabinet.');
      return;
    }
    setPhase('aim');
    setMessage('Missed. Line up another drop.');
  };

  const handleDrop = () => {
    if (phase !== 'aim' || attemptsLeft <= 0) {
      return;
    }

    const lanePrizes = lanes[targetLane];
    const depthTarget = Math.min(0.76, 0.24 + lanePrizes.length * 0.14);
    setPhase('drop');
    setDropDepth(depthTarget);
    setAttemptsLeft((value) => value - 1);
    playSfx('arcadeSelect');
    setMessage(`Dropping into lane ${targetLane + 1}.`);

    window.setTimeout(() => {
      const nextLanes = cloneLanes(lanes);
      const prize = nextLanes[targetLane].pop() || null;
      const nextAttempts = attemptsLeft - 1;
      const nextPrizeCount = nextLanes.reduce((total, lane) => total + lane.length, 0);
      const nextScore = prize ? score + prize.value + nextAttempts * 12 : score;

      setPhase(prize ? 'grab' : 'rise');
      setLanes(nextLanes);
      if (prize) {
        playSfx('arcadeSuccess');
        setMessage(`${prize.name} caught. Bringing it back up.`);
      } else {
        playSfx('arcadeError');
      }

      window.setTimeout(() => {
        finishRun(nextScore, prize, nextAttempts, nextPrizeCount);
      }, 420);
    }, 540);
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,244,232,0.96))] p-2 shadow-[0_24px_70px_rgba(234,88,12,0.16)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">{score} pts</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{attemptsLeft} drops</Badge>
          </div>
          <Button variant="outline" size="icon" className="rounded-full md:w-auto md:px-4" onClick={reset} aria-label="Reset">
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          {finished ? <ArcadeSessionStatus sessionId={sessionId} modeId="claw-crane" score={score} completed={Boolean(capturedPrize)} /> : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,231,214,0.92)_40%,rgba(251,191,36,0.18)_100%)] shadow-inner">
          <div className="flex items-center justify-between gap-3 border-b border-white/70 px-4 py-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Prize Crane</div>
              <div className="text-sm font-semibold text-slate-700">Drop once per lane sweep. A clean catch ends the round.</div>
            </div>
            <Badge className="rounded-full bg-white/85 text-orange-950 hover:bg-white/85">
              <Target className="mr-1 h-3.5 w-3.5" />
              Lane {targetLane + 1}
            </Badge>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden p-3 md:p-5">
            <div className="absolute inset-x-3 top-3 h-5 rounded-full bg-[linear-gradient(180deg,rgba(148,163,184,0.95),rgba(100,116,139,0.92))] shadow-[0_10px_18px_rgba(15,23,42,0.16)] md:inset-x-5" />

            <div
              className="absolute top-5 z-20 flex -translate-x-1/2 flex-col items-center transition-[left] duration-75"
              style={{ left: `${clawPosition * 100}%` }}
            >
              <div className="w-1 rounded-full bg-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.4)]" style={{ height: `${3.25 + dropDepth * 14}rem` }} />
              <div className="relative -mt-1.5 flex h-12 w-12 items-start justify-center rounded-full bg-[linear-gradient(180deg,#fef3c7_0%,#fb923c_100%)] shadow-[0_12px_24px_rgba(249,115,22,0.28)]">
                <span className="mt-2 h-3.5 w-5 rounded-full bg-white/85" />
                <span className="absolute bottom-0 left-[8px] h-5 w-[3px] origin-top rotate-[22deg] rounded-full bg-slate-500" />
                <span className="absolute bottom-0 right-[8px] h-5 w-[3px] origin-top -rotate-[22deg] rounded-full bg-slate-500" />
                <span className="absolute bottom-[4px] left-1/2 h-5 w-[3px] -translate-x-1/2 rounded-full bg-slate-500" />
              </div>
            </div>

            <div className="absolute inset-x-3 bottom-3 top-12 rounded-[1.6rem] border-[5px] border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.35))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_28px_48px_rgba(15,23,42,0.08)] md:inset-x-5">
              <div className="absolute inset-0 rounded-[1.25rem] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.3)_0_1px,transparent_1px_20%),linear-gradient(180deg,rgba(251,191,36,0.08),rgba(244,114,182,0.05))]" />
              <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-[1.3rem] bg-[linear-gradient(180deg,rgba(253,186,116,0.18),rgba(251,146,60,0.3))]" />

              <div className="relative z-10 grid h-full grid-cols-5 gap-2 px-3 pb-3 pt-10 md:px-5">
                {lanes.map((lane, laneIndex) => (
                  <div
                    key={laneIndex}
                    className={cn(
                      'relative flex flex-col-reverse items-center justify-start rounded-[1.2rem] border border-dashed border-orange-200/70 bg-white/18 px-1 pb-3 pt-2',
                      targetLane === laneIndex && phase === 'aim' && 'ring-2 ring-orange-300/80'
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-2 bottom-1 h-2 rounded-full bg-orange-200/50 blur-sm" />
                    {lane.map((prize, prizeIndex) => (
                      <div
                        key={prize.id}
                        className="relative mb-2 flex h-12 w-full max-w-[4.2rem] items-center justify-center rounded-[1rem] border border-white/80 text-center text-[0.55rem] font-black uppercase tracking-[0.1em] text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] md:h-14 md:text-[0.62rem]"
                        style={{
                          background: prize.accent,
                          boxShadow: `0 12px 22px ${prize.glow}`,
                          transform: `rotate(${(laneIndex - 2) * 3 + prizeIndex * 2}deg)`,
                        }}
                      >
                        <span className="px-1 leading-tight">{prize.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/70 px-3 py-3 md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-h-5 text-sm font-semibold text-slate-700">
                {capturedPrize ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <Trophy className="h-4 w-4" />
                    {capturedPrize.name} banked for {score} points.
                  </span>
                ) : (
                  message
                )}
              </div>
              <Button
                type="button"
                className="rounded-full bg-[linear-gradient(135deg,#fb923c,#f43f5e)] px-6 text-white shadow-[0_16px_34px_rgba(244,63,94,0.22)] hover:opacity-95"
                onClick={handleDrop}
                disabled={phase !== 'aim' || attemptsLeft <= 0}
              >
                Drop Claw
              </Button>
            </div>
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
