'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  Coins,
  Gamepad2,
  Gift,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useUser } from '@/firebase';
import ClawCraneScene, {
  type ClawCraneSceneHandle,
} from '@/components/minigames/claw-crane-scene';
import ClawPrizePreview from '@/components/minigames/claw-prize-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameScreen } from '@/components/game-screen';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAudio } from '@/hooks/use-audio';
import {
  CLAW_CREDIT_COST,
  CLAW_PRIZE_BY_ID,
  CLAW_PRIZE_CATALOG,
  type ClawCollection,
  type ClawPhase,
  type ClawPlay,
  type ClawStats,
} from '@/lib/claw-crane';
import { cn } from '@/lib/utils';

type ServerState = {
  berries: number;
  credits: number;
  collection: ClawCollection;
  stats: ClawStats;
  stockedPrizeIds: string[];
  activePlay: ClawPlay | null;
  creditCost: number;
};

type ResultState = {
  kind: 'win' | 'miss';
  prizeId: string | null;
  score: number;
  rewards?: { berries: number; experience: number };
};

const PRACTICE_STOCK = CLAW_PRIZE_CATALOG.slice(0, 12).map((prize) => prize.id);

const PHASE_LABELS: Record<ClawPhase, string> = {
  loading: 'Stocking cabinet',
  ready: 'Ready to aim',
  aiming: 'Carriage moving',
  dropping: 'Claw descending',
  closing: 'Fingers closing',
  lifting: 'Testing the grip',
  delivering: 'Moving to the prize chute',
  releasing: 'Opening over the chute',
  result: 'Play complete',
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'The prize crane request failed.');
  return body;
}

export default function ClawCraneGame() {
  const { playSfx } = useAudio();
  const { user, isUserLoading } = useUser();
  const sceneRef = useRef<ClawCraneSceneHandle>(null);
  const activePlayRef = useRef<ClawPlay | null>(null);
  const resumedPlayIdRef = useRef<string | null>(null);
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [phase, setPhase] = useState<ClawPhase>('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading the cabinet and checking the gantry.');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ResultState | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [selectedPrizeId, setSelectedPrizeId] = useState(CLAW_PRIZE_CATALOG[0].id);
  const [joystick, setJoystick] = useState({ x: 0, z: 0, active: false });
  const practice = !isUserLoading && !user?.uid;

  const stockedPrizeIds = practice
    ? PRACTICE_STOCK
    : serverState?.stockedPrizeIds || [];
  const canRenderScene = practice || Boolean(serverState);
  const credits: number | 'unlimited' = practice ? 'unlimited' : serverState?.credits || 0;
  const berries = practice ? null : serverState?.berries ?? null;
  const collection = serverState?.collection || {
    ownedPrizeIds: [],
    prizeWonAt: {},
    total: CLAW_PRIZE_CATALOG.length,
    complete: false,
  };
  const selectedPrize = CLAW_PRIZE_BY_ID[selectedPrizeId] || CLAW_PRIZE_CATALOG[0];
  const selectedOwned = collection.ownedPrizeIds.includes(selectedPrize.id);
  const canControl = sceneReady && !busy && (phase === 'ready' || phase === 'aiming');
  const canDrop = canControl && (practice || Number(credits) > 0) && !collection.complete;
  const stockKey = stockedPrizeIds.join('|');

  useEffect(() => {
    setSceneReady(false);
    setPhase('loading');
  }, [stockKey]);

  const loadState = useCallback(async () => {
    if (isUserLoading) return;
    if (!user?.uid) {
      activePlayRef.current = null;
      setServerState(null);
      setError(null);
      setMessage('Practice mode: unlimited drops, with no saved credits or prizes.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/minigames/claw-crane', { cache: 'no-store' });
      const payload = await readJson(response);
      const state = payload.state as ServerState;
      setServerState(state);
      activePlayRef.current = state.activePlay;
      setMessage(
        state.activePlay
          ? 'Resuming the drop that was interrupted on this cabinet.'
          : state.collection.complete
            ? 'Collection complete. Every character has found a home.'
            : 'Move the carriage on both rails, then drop over the prize you want.'
      );
    } catch (requestError: any) {
      setError(requestError?.message || 'The saved crane cabinet could not be loaded.');
    } finally {
      setBusy(false);
    }
  }, [isUserLoading, user?.uid]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const activePlay = serverState?.activePlay;
    if (
      sceneReady &&
      activePlay &&
      resumedPlayIdRef.current !== activePlay.id &&
      sceneRef.current
    ) {
      resumedPlayIdRef.current = activePlay.id;
      activePlayRef.current = activePlay;
      setMessage('Resuming your paid drop from its saved carriage position.');
      sceneRef.current.startDrop(activePlay);
    }
  }, [sceneReady, serverState?.activePlay]);

  const updateServerState = (state: ServerState) => {
    setServerState(state);
    activePlayRef.current = state.activePlay;
  };

  const purchaseCredit = async () => {
    if (practice || busy || collection.complete) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/minigames/claw-crane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase-credit' }),
      });
      const payload = await readJson(response);
      updateServerState(payload.state as ServerState);
      playSfx('arcadeSelect');
      setMessage(`Credit inserted. The Drop button is armed.`);
    } catch (requestError: any) {
      playSfx('arcadeError');
      setError(requestError?.message || 'Could not insert a crane credit.');
    } finally {
      setBusy(false);
    }
  };

  const requestDrop = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene || !sceneReady || busy || (phase !== 'ready' && phase !== 'aiming')) return;
    setError(null);
    setLastResult(null);
    if (practice) {
      playSfx('arcadeSelect');
      scene.startDrop(null);
      setMessage('Practice drop started. Line up the fingers and watch the grip.');
      return;
    }
    if (!serverState || serverState.collection.complete) return;
    if (serverState.credits <= 0) {
      setMessage(`Insert a ${CLAW_CREDIT_COST}-berry credit before dropping.`);
      playSfx('arcadeError');
      return;
    }
    setBusy(true);
    try {
      const position = scene.getPosition();
      const response = await fetch('/api/minigames/claw-crane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-play',
          clawX: position.x,
          clawZ: position.z,
        }),
      });
      const payload = await readJson(response);
      const state = payload.state as ServerState;
      updateServerState(state);
      const play = payload.play as ClawPlay;
      activePlayRef.current = play;
      resumedPlayIdRef.current = play.id;
      playSfx('arcadeSelect');
      scene.startDrop(play);
      setMessage('Credit accepted. The claw is descending.');
    } catch (requestError: any) {
      playSfx('arcadeError');
      setError(requestError?.message || 'Could not start this drop.');
    } finally {
      setBusy(false);
    }
  }, [busy, phase, playSfx, practice, sceneReady, serverState]);

  const handleResolved = useCallback(
    async (result: { kind: 'win' | 'miss'; prizeId: string | null; score: number }) => {
      const localResult: ResultState = result;
      setLastResult(localResult);
      if (result.kind === 'win') {
        playSfx('arcadeSuccess');
        setMessage(`${CLAW_PRIZE_BY_ID[result.prizeId || '']?.name || 'Prize'} reached the chute!`);
      } else {
        playSfx('arcadeError');
        setMessage('The claw came back empty. Reposition and try another drop.');
      }
      if (practice) return;
      const play = activePlayRef.current;
      if (!play) {
        setError('The cabinet finished visually, but its saved play record is missing.');
        return;
      }
      setBusy(true);
      try {
        const response = await fetch('/api/minigames/claw-crane', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'settle-play',
            playId: play.id,
            prizeId: result.prizeId,
            score: result.score,
          }),
        });
        const payload = await readJson(response);
        const state = payload.state as ServerState;
        updateServerState(state);
        activePlayRef.current = null;
        setLastResult({
          ...localResult,
          prizeId: payload.wonPrizeId || null,
          rewards: payload.rewards,
        });
        if (payload.wonPrizeId) setSelectedPrizeId(payload.wonPrizeId);
        setMessage(
          payload.wonPrizeId
            ? `${CLAW_PRIZE_BY_ID[payload.wonPrizeId]?.name || 'Prize'} saved to My Prizes.`
            : 'Play saved as a miss. The cabinet has been restocked.'
        );
      } catch (requestError: any) {
        setError(requestError?.message || 'The play finished, but its result could not be saved.');
      } finally {
        setBusy(false);
      }
    },
    [playSfx, practice]
  );

  const handleJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canControl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2);
    const x = (event.clientX - (bounds.left + bounds.width / 2)) / radius;
    const z = (event.clientY - (bounds.top + bounds.height / 2)) / radius;
    const magnitude = Math.max(1, Math.sqrt(x * x + z * z));
    const next = { x: x / magnitude, z: z / magnitude, active: true };
    setJoystick(next);
    sceneRef.current?.setInput(next.x, next.z);
  };

  const releaseJoystick = (event?: ReactPointerEvent<HTMLDivElement>) => {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setJoystick({ x: 0, z: 0, active: false });
    sceneRef.current?.setInput(0, 0);
  };

  const ownedCount = collection.ownedPrizeIds.length;
  const activeStatus = error || message;
  const rewardText = lastResult?.rewards
    ? `+${lastResult.rewards.berries} berries · +${lastResult.rewards.experience} XP`
    : null;

  return (
    <GameScreen className="max-w-[1500px]">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.35rem] border border-white/80 bg-[linear-gradient(155deg,#fffaf5,#ffe9ef_55%,#e8fbff)] p-2 shadow-[0_24px_70px_rgba(244,63,94,0.15)] md:gap-3 md:p-4">
        <div className="ml-11 flex min-h-10 shrink-0 items-center justify-end gap-1.5 md:ml-0 md:justify-between md:gap-3">
          <div className="hidden min-w-0 md:block">
            <div className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-rose-500">Pick Me Up Prize Crane</div>
            <div className="truncate text-sm font-semibold text-slate-700">{PHASE_LABELS[phase]}</div>
          </div>
          <div className="flex items-center justify-end gap-1.5 md:gap-2">
            <Badge className="rounded-full bg-white/90 px-2.5 text-slate-800 hover:bg-white/90">
              {practice ? <Gamepad2 className="mr-1 h-3.5 w-3.5" /> : <Coins className="mr-1 h-3.5 w-3.5 text-amber-500" />}
              {practice ? 'Practice' : `${credits} credit${credits === 1 ? '' : 's'}`}
            </Badge>
            {!practice && (
              <Badge variant="secondary" className="hidden rounded-full px-2.5 sm:inline-flex">
                {berries?.toLocaleString() || 0} berries
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full bg-white/88 px-2.5 md:px-3"
              onClick={() => setCollectionOpen(true)}
              data-testid="claw-collection"
            >
              <Gift className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">My Prizes</span>
              <span className="ml-1 text-xs">{ownedCount}/{collection.total}</span>
            </Button>
            {!practice && (
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-amber-400 px-3 font-black text-amber-950 shadow-sm hover:bg-amber-300"
                disabled={busy || collection.complete || (berries || 0) < CLAW_CREDIT_COST}
                onClick={purchaseCredit}
                data-testid="claw-insert-credit"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Insert ${CLAW_CREDIT_COST}`}
              </Button>
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-white/90 bg-rose-50 shadow-inner">
          {canRenderScene ? (
            <ClawCraneScene
              key={stockKey}
              ref={sceneRef}
              stockedPrizeIds={stockedPrizeIds}
              practice={practice}
              credits={credits}
              berries={berries}
              onReady={() => {
                setSceneReady(true);
                setPhase('ready');
              }}
              onPhaseChange={setPhase}
              onDropRequested={() => void requestDrop()}
              onResolved={(result) => void handleResolved(result)}
            />
          ) : (
            <div className="h-full w-full bg-rose-50" />
          )}

          <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center">
            <div
              className={cn(
                'max-w-[min(38rem,90%)] rounded-full border px-3 py-1.5 text-center text-xs font-bold shadow-lg backdrop-blur-md md:text-sm',
                error
                  ? 'border-red-200 bg-red-50/95 text-red-700'
                  : lastResult?.kind === 'win'
                    ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                    : 'border-white/80 bg-white/86 text-slate-700'
              )}
              role="status"
            >
              {activeStatus}
              {rewardText ? <span className="ml-2 text-emerald-700">{rewardText}</span> : null}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 z-20 md:bottom-5 md:left-5">
            <div
              className={cn(
                'relative h-[5.8rem] w-[5.8rem] touch-none rounded-full border-[3px] border-white/80 bg-slate-900/38 shadow-[0_14px_28px_rgba(15,23,42,0.25)] backdrop-blur-md md:h-28 md:w-28',
                !canControl && 'opacity-45'
              )}
              data-testid="claw-joystick"
              aria-label="Move claw carriage"
              onPointerDown={handleJoystick}
              onPointerMove={(event) => {
                if (joystick.active) handleJoystick(event);
              }}
              onPointerUp={releaseJoystick}
              onPointerCancel={releaseJoystick}
            >
              <div className="absolute inset-3 rounded-full border border-white/30" />
              <div
                className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_35%_30%,#fecdd3,#fb7185_58%,#be123c)] shadow-lg transition-transform md:h-12 md:w-12"
                style={{
                  transform: `translate(calc(-50% + ${joystick.x * 24}px), calc(-50% + ${joystick.z * 24}px))`,
                }}
              />
            </div>
            <div className="mt-1 text-center text-[0.6rem] font-black uppercase tracking-[0.16em] text-white drop-shadow md:text-xs">
              Move
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2 md:bottom-5 md:right-5">
            {!practice && Number(credits) <= 0 && !collection.complete ? (
              <div className="rounded-full bg-slate-950/55 px-3 py-1 text-[0.65rem] font-bold text-white backdrop-blur md:text-xs">
                Insert a credit first
              </div>
            ) : null}
            <Button
              type="button"
              className="h-[5.2rem] w-[5.2rem] rounded-full border-4 border-white/85 bg-[radial-gradient(circle_at_35%_25%,#fde68a,#fb7185_58%,#e11d48)] p-0 text-base font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_32px_rgba(190,24,93,0.38)] hover:scale-[1.02] hover:opacity-100 active:scale-95 md:h-28 md:w-28 md:text-lg"
              onClick={() => void requestDrop()}
              disabled={!canDrop}
              data-testid="claw-drop"
            >
              {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : collection.complete ? <Trophy className="h-7 w-7" /> : 'Drop'}
            </Button>
            <div className="text-center text-[0.6rem] font-black uppercase tracking-[0.14em] text-white drop-shadow md:text-xs">
              Space
            </div>
          </div>

          {!sceneReady && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-white/75 backdrop-blur">
              <div className="flex flex-col items-center gap-3 text-rose-700">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-black uppercase tracking-[0.18em]">Building gantry</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-h-8 shrink-0 items-center justify-between gap-2 px-1 text-[0.7rem] font-semibold text-slate-600 md:text-xs">
          <span className="truncate">Joystick or WASD/arrows moves both rails · Space drops · F fullscreen</span>
          {!practice && error ? (
            <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-full" onClick={() => void loadState()}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      </div>

      <Sheet open={collectionOpen} onOpenChange={setCollectionOpen}>
        <SheetContent side="right" className="h-[100svh] w-full max-w-xl overflow-y-auto bg-[linear-gradient(155deg,#fffaf5,#ffe9ef_60%,#e8fbff)] sm:w-[34rem] sm:max-w-[34rem]">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Gift className="h-6 w-6 text-rose-500" />
              My Prizes
            </SheetTitle>
            <SheetDescription>
              {practice
                ? 'Sign in to save characters you carry to the prize chute.'
                : `${ownedCount} of ${collection.total} characters collected. The cabinet only stocks characters you still need.`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-white/90 bg-white/65 shadow-lg">
            {selectedOwned ? (
              <ClawPrizePreview prize={selectedPrize} visible={collectionOpen} />
            ) : (
              <div className="grid h-56 place-items-center bg-[radial-gradient(circle,#fff,#e2e8f0)]">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <LockKeyhole className="h-12 w-12" />
                  <span className="font-black uppercase tracking-[0.16em]">Still in the machine</span>
                </div>
              </div>
            )}
            <div className="border-t border-white/80 bg-white/80 px-5 py-4">
              <div className="text-xl font-black text-slate-900">{selectedPrize.name}</div>
              <div className="text-sm font-semibold text-slate-600">
                {selectedOwned
                  ? `Won ${new Date(collection.prizeWonAt[selectedPrize.id] || Date.now()).toLocaleDateString()}`
                  : 'Guide the claw around this character and carry it to the chute.'}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {CLAW_PRIZE_CATALOG.map((prize) => {
              const owned = collection.ownedPrizeIds.includes(prize.id);
              const selected = prize.id === selectedPrize.id;
              return (
                <button
                  key={prize.id}
                  type="button"
                  onClick={() => setSelectedPrizeId(prize.id)}
                  className={cn(
                    'relative flex min-h-24 flex-col items-center justify-center rounded-2xl border p-2 text-center transition',
                    selected ? 'border-rose-400 bg-white shadow-lg ring-2 ring-rose-200' : 'border-white/80 bg-white/65 hover:bg-white',
                    !owned && 'text-slate-400'
                  )}
                >
                  <span
                    className={cn(
                      'mb-2 grid h-10 w-10 place-items-center rounded-full text-lg font-black text-white shadow-sm',
                      !owned && 'grayscale'
                    )}
                    style={{ backgroundColor: prize.previewColor }}
                  >
                    {owned ? prize.name.slice(0, 1) : <LockKeyhole className="h-4 w-4" />}
                  </span>
                  <span className="text-xs font-black">{prize.name}</span>
                  {owned ? <Sparkles className="absolute right-2 top-2 h-3.5 w-3.5 text-amber-400" /> : null}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </GameScreen>
  );
}
