'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Cherry, CircleHelp, Clock3, Coins, Gauge, Sparkles, Trophy } from 'lucide-react';
import AppLayout from '@/components/app-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useBerries } from '@/hooks/use-berries';
import { getDailyChallenge, MODE_METADATA, normalizeRetentionState, type GameModeCategory, type RetentionModeId } from '@/lib/retention';

const ARCADE_MODE_IDS = ['word-search', 'five-in-six', 'word-connect', 'wheel', 'liquid-sort', 'match-sort', 'solitaire', 'claw-crane'] as const satisfies readonly RetentionModeId[];
const SHELVES: Array<{ id: GameModeCategory; title: string; description: string }> = [
  { id: 'word-games', title: 'Word Games', description: 'Quick vocabulary challenges and phrase puzzles.' },
  { id: 'puzzle-shelf', title: 'Puzzle Shelf', description: 'Storybook sorting and card-table challenges.' },
  { id: 'prize-corner', title: 'Prize Corner', description: 'Spend earned berries on Claw Tokens and grow your character collection.' },
];

function lastPlayedLabel(value?: string | null) {
  if (!value) return 'Not played yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Played before';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Played today';
  if (days === 1) return 'Played yesterday';
  return `Played ${days} days ago`;
}

export default function MinigamesPage() {
  const { user } = useUser();
  const { berries, isLoading: isBerriesLoading } = useBerries();
  const userRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const retention = normalizeRetentionState(profile?.retention);
  const daily = getDailyChallenge();

  return (
    <AppLayout>
      <div className="page-shell space-y-7">
        <section className="glass-panel overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Letters with Characters</div>
              <h1 className="mt-2 font-headline text-4xl font-black text-slate-950">Storybook Arcade</h1>
              <p className="mt-2 font-semibold text-slate-600">Choose a story, learn its goal, clear the challenge, then carry your rewards into the next game.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="soft-card rounded-2xl px-4 py-3"><Cherry className="mb-1 h-4 w-4 text-rose-500" /><strong>{isBerriesLoading ? '…' : berries}</strong><div className="text-xs text-slate-500">berries</div></div>
              <div className="soft-card rounded-2xl px-4 py-3"><Sparkles className="mb-1 h-4 w-4 text-amber-500" /><strong>{retention.streakCount}</strong><div className="text-xs text-slate-500">day streak</div></div>
              <div className="soft-card col-span-2 rounded-2xl px-4 py-3 sm:col-span-1"><Coins className="mb-1 h-4 w-4 text-sky-500" /><strong>25 berries</strong><div className="text-xs text-slate-500">per Claw Token</div></div>
            </div>
          </div>
        </section>

        {SHELVES.map((shelf) => {
          const modes = ARCADE_MODE_IDS.map((id) => MODE_METADATA[id]).filter((mode) => mode.category === shelf.id);
          return (
            <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`} className="space-y-3">
              <div>
                <h2 id={`shelf-${shelf.id}`} className="font-headline text-2xl font-black text-slate-950">{shelf.title}</h2>
                <p className="text-sm font-semibold text-slate-600">{shelf.description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {modes.map((mode) => {
                  const progress = retention.modeProgress[mode.id];
                  const isDaily = daily.modeId === mode.id;
                  return (
                    <Link key={mode.id} href={mode.href} className="group block rounded-[1.6rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300" aria-label={`Play ${mode.title}`}>
                      <Card className="soft-card h-full overflow-hidden rounded-[1.6rem] transition group-hover:-translate-y-1 group-hover:shadow-xl">
                        <CardContent className="flex h-full flex-col gap-4 p-4">
                          <div className="flex items-start gap-3">
                            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${mode.accent}`}><Image src={mode.iconPath} alt="" width={34} height={34} /></span>
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-headline text-xl font-black text-slate-950">{mode.title}</h3>{isDaily ? <Badge className="rounded-full">Today’s challenge</Badge> : null}</div><p className="mt-1 text-sm font-semibold leading-snug text-slate-600">{mode.objective}</p></div>
                            <ArrowRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" />{mode.difficulty}</span>
                            <span className="inline-flex items-center gap-1.5"><CircleHelp className="h-3.5 w-3.5" />{mode.controls}</span>
                            <span className="inline-flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Best {progress.bestScore}</span>
                            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{lastPlayedLabel(progress.lastPlayedAt)}</span>
                          </div>
                          <div className="mt-auto rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">{mode.reward}</div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AppLayout>
  );
}
