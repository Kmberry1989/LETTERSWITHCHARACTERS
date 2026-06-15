'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { normalizeDirectThreads } from '@/lib/direct-threads';
import { normalizeRetentionState, getRetentionSummary, MODE_METADATA } from '@/lib/retention';
import { useDirectThreads } from '@/hooks/use-direct-threads';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  opponents?: OpponentSummary[];
};

export function DashboardTaskbar({ hasUsersTurn, nextTurnHref }: DashboardTaskbarProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const { data: rawThreads, refresh } = useDirectThreads(Boolean(user));

  const retention = useMemo(() => normalizeRetentionState(userProfile?.retention), [userProfile?.retention]);
  const summary = useMemo(() => getRetentionSummary(retention), [retention]);
  const threads = useMemo(() => normalizeDirectThreads(rawThreads), [rawThreads]);
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
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(threadId)}/invites/${encodeURIComponent(inviteId)}/accept`, {
      method: 'POST',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Could not accept invite.');
    window.location.href = `/game?game=${result.gameId}`;
  };

  const handleSafe = async (action: () => Promise<void>, errorTitle: string) => {
    try {
      await action();
      await refresh().catch(() => null);
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
      <div className="grid gap-3 lg:grid-cols-2">
        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="soft-card rounded-[1.55rem] px-4 py-4 text-left transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Quests</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{summary.completedQuests}/{summary.quests.length}</div>
                </div>
                <div className="icon-badge h-11 w-11">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <Progress value={questPercent} className="mt-3 h-2" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xl overflow-y-auto bg-[#f6faef]">
            <SheetHeader>
              <SheetTitle>Quests</SheetTitle>
              <SheetDescription>Your daily progress view. Eligible rewards auto-claim on clear.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className={`rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${MODE_METADATA[summary.dailyChallenge.modeId].accent} p-4`}>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Daily</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{summary.dailyChallenge.title}</div>
                <div className="mt-2 text-sm text-slate-700">{summary.dailyChallenge.targetLabel}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-white/80 text-slate-900 hover:bg-white/80">+{summary.dailyChallenge.rewardExperience} XP</Badge>
                  <Badge className="rounded-full bg-white/80 text-slate-900 hover:bg-white/80">+{summary.dailyChallenge.rewardBerries} berries</Badge>
                  <Badge variant="outline" className="rounded-full border-white/80 bg-white/[.55] text-slate-800">
                    {summary.rewardClaimedToday ? 'Auto-claimed today' : 'Auto-claims on your next eligible clear'}
                  </Badge>
                  {summary.dailyChallengeCompleted ? <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Completed</Badge> : null}
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
                        <Badge variant={done ? 'default' : 'secondary'} className="rounded-full">{quest.progress}/{quest.goal}</Badge>
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
            <button type="button" className="soft-card rounded-[1.55rem] px-4 py-4 text-left transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Notifications</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{notificationCount}</div>
                </div>
                <motion.div key={notificationCount} initial={{ scale: 0.9, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="icon-badge h-11 w-11">
                  <Bell className="h-5 w-5 text-sky-500" />
                </motion.div>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {hasUsersTurn ? 'Your game is ready.' : pendingInvites.length > 0 ? `${pendingInvites.length} invite${pendingInvites.length === 1 ? '' : 's'} waiting.` : 'All clear.'}
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[#f6faef]">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>Your turn, invites, and quick status changes.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {hasUsersTurn ? (
                <Link href={nextTurnHref || '/dashboard'} className="block rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 font-black text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    Your turn is ready
                  </div>
                  <div className="mt-1 text-sm text-emerald-800">Jump straight back into the live game.</div>
                </Link>
              ) : null}
              {pendingInvites.map((message) => {
                const thread = threads.find((item) => item.messages.some((entry) => entry.id === message.id));
                if (!thread || !message.invite) return null;
                const senderId = message.invite.senderId;
                const senderMeta = thread.participantMeta[senderId];
                return (
                  <div key={message.id} className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                    <div className="font-black text-amber-900">{senderMeta?.displayName || 'Player'} invited you to play</div>
                    <div className="mt-1 text-sm text-amber-800">Accept to start a new game immediately.</div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-full" onClick={() => void handleSafe(() => acceptInvite(thread.id, message.invite!.id), 'Accept failed')}>
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!hasUsersTurn && pendingInvites.length === 0 ? <div className="rounded-[1.25rem] border border-dashed border-slate-200 p-4 text-sm text-slate-500">No new notifications right now.</div> : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.div>
  );
}
