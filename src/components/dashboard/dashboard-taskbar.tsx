'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { normalizeDirectThreads } from '@/lib/direct-threads';
import { normalizeRetentionState, getNextActionHref, getRetentionSummary, MODE_METADATA } from '@/lib/retention';
import { useDirectThreads } from '@/hooks/use-direct-threads';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type OpponentSummary = {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  avatarPosterUrl?: string | null;
};

type DashboardTaskbarProps = {
  hasUsersTurn: boolean;
  nextTurnHref?: string;
  opponents: OpponentSummary[];
};

export function DashboardTaskbar({ hasUsersTurn, nextTurnHref }: DashboardTaskbarProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const { data: rawThreads } = useDirectThreads(Boolean(user));

  const retention = useMemo(() => normalizeRetentionState(userProfile?.retention), [userProfile?.retention]);
  const summary = useMemo(() => getRetentionSummary(retention), [retention]);
  const threads = useMemo(() => normalizeDirectThreads(rawThreads), [rawThreads]);
  const nextActionHref = hasUsersTurn ? nextTurnHref || '/dashboard' : getNextActionHref(retention, false);
  const nextActionLabel = hasUsersTurn ? 'Your turn' : summary.dailyChallengeCompleted ? 'Open arcade' : MODE_METADATA[summary.dailyChallenge.modeId].title;
  const questPercent = summary.totalQuestGoal > 0 ? Math.round((summary.totalQuestProgress / summary.totalQuestGoal) * 100) : 0;
  const pendingInvites = useMemo(
    () =>
      threads.flatMap((thread) =>
        (thread.messages || []).filter(
          (message) => message.invite?.recipientId === user?.uid && message.invite?.status === 'pending'
        )
      ),
    [threads, user]
  );
  const notificationCount = (hasUsersTurn ? 1 : 0) + pendingInvites.length;

  const acceptInvite = async (threadId: string, inviteId: string) => {
    const response = await fetch(
      `/api/direct-threads/${encodeURIComponent(threadId)}/invites/${encodeURIComponent(inviteId)}/accept`,
      { method: 'POST' }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || 'Could not accept invite.');
    }
    window.location.href = `/game?game=${result.gameId}`;
  };

  const handleSafe = async (action: () => Promise<void>, errorTitle: string) => {
    try {
      await action();
    } catch (error: any) {
      toast({
        title: errorTitle,
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="glass-panel rounded-[2rem] p-3"
    >
      <div className="grid gap-3 lg:grid-cols-[1.12fr,0.82fr,0.82fr]">
        <Link
          href={nextActionHref}
          className="group relative overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_18%_0%,rgba(141,92,255,.44),transparent_34%),linear-gradient(135deg,#111827,#020617)] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_18px_40px_rgba(15,23,42,.18)] transition-transform hover:-translate-y-0.5 sm:px-5"
        >
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-white/58">Next</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-black">
                {nextActionLabel}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={nextActionLabel}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
            <Badge className="rounded-full bg-white/14 px-3 py-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18)] hover:bg-white/14">
              {hasUsersTurn ? 'Live' : 'Ready'}
            </Badge>
          </div>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="soft-card rounded-[1.5rem] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white/86">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Quests</div>
                  <div className="mt-1 text-xl font-black text-slate-950">
                    {summary.completedQuests}/{summary.quests.length}
                  </div>
                </div>
                <span className="icon-badge h-10 w-10 rounded-[0.9rem] text-amber-500">
                  <Sparkles className="h-5 w-5" />
                </span>
              </div>
              <Progress value={questPercent} className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xl overflow-y-auto bg-[#f6faef]/95 backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">Quests</SheetTitle>
              <SheetDescription>Your compact daily progress view. Eligible daily rewards auto-claim on clear.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className={`rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${MODE_METADATA[summary.dailyChallenge.modeId].accent} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.65),0_12px_26px_rgba(35,50,80,.08)]`}>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Daily</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{summary.dailyChallenge.title}</div>
                <div className="mt-2 text-sm text-slate-700">{summary.dailyChallenge.targetLabel}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-white/80 text-slate-900 hover:bg-white/80">
                    +{summary.dailyChallenge.rewardExperience} XP
                  </Badge>
                  <Badge className="rounded-full bg-white/80 text-slate-900 hover:bg-white/80">
                    +{summary.dailyChallenge.rewardBerries} berries
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-white/80 bg-white/55 text-slate-800">
                    {summary.rewardClaimedToday ? 'Auto-claimed today' : 'Auto-claims on clear'}
                  </Badge>
                  {summary.dailyChallengeCompleted ? (
                    <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Completed</Badge>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3">
                {summary.quests.map((quest) => {
                  const done = quest.progress >= quest.goal;
                  return (
                    <div key={quest.id} className="soft-card rounded-[1.25rem] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{quest.title}</div>
                          <div className="text-sm text-slate-600">{quest.description}</div>
                        </div>
                        <Badge variant={done ? 'default' : 'secondary'} className="rounded-full">
                          {quest.progress}/{quest.goal}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="soft-card rounded-[1.5rem] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white/86">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Notifications</div>
                  <div className="mt-1 text-xl font-black text-slate-950">{notificationCount}</div>
                </div>
                <motion.span
                  key={notificationCount}
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="icon-badge h-10 w-10 rounded-[0.9rem] text-sky-500"
                >
                  <Bell className="h-5 w-5" />
                </motion.span>
              </div>
              <div className="mt-3 line-clamp-1 text-sm text-slate-500">
                {hasUsersTurn ? 'Your game is ready.' : pendingInvites.length > 0 ? `${pendingInvites.length} invite${pendingInvites.length === 1 ? '' : 's'} waiting.` : 'All clear.'}
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[#f6faef]/95 backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">Notifications</SheetTitle>
              <SheetDescription>Your turns, invites, and quick status changes.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {hasUsersTurn ? (
                <Link href={nextActionHref} className="block rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 font-black text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    Your turn is ready
                  </div>
                  <div className="mt-1 text-sm text-emerald-800">Jump straight back into the live game.</div>
                </Link>
              ) : null}
              <ScrollArea className="max-h-[58vh] pr-2">
                <div className="space-y-3">
                  {pendingInvites.map((message) => {
                    const thread = threads.find((item) => item.messages.some((entry) => entry.id === message.id));
                    if (!thread || !message.invite) return null;
                    const senderId = message.invite.senderId;
                    const senderMeta = thread.participantMeta[senderId];
                    return (
                      <div key={message.id} className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <div className="font-black text-amber-900">{senderMeta?.displayName || 'Player'} invited you to play</div>
                        <div className="mt-1 text-sm text-amber-800">Accept to start a new game immediately.</div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="reward"
                            onClick={() => void handleSafe(() => acceptInvite(thread.id, message.invite!.id), 'Accept failed')}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {!hasUsersTurn && pendingInvites.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">No new notifications right now.</div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.div>
  );
}
