'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, ChevronRight, MessageSquare, Plus, Send, Sparkles, Swords } from 'lucide-react';
import { useDoc, useMemoFirebase, useUser, useUsers } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import type { DirectThread } from '@/lib/direct-threads';
import { getThreadCounterpartId, getThreadUnreadCount, normalizeDirectThreads } from '@/lib/direct-threads';
import { normalizeRetentionState, getNextActionHref, getRetentionSummary, MODE_METADATA } from '@/lib/retention';
import { useDirectThreads } from '@/hooks/use-direct-threads';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

function formatThreadTime(thread: DirectThread) {
  const timestamp = Date.parse(thread.updatedAt);
  if (Number.isNaN(timestamp)) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function MessageComposer({
  activeThread,
  currentUserId,
  onSend,
  onInvite,
  onAcceptInvite,
}: {
  activeThread: DirectThread | null;
  currentUserId: string;
  onSend: (thread: DirectThread, text: string) => Promise<void>;
  onInvite: (thread: DirectThread) => Promise<void>;
  onAcceptInvite: (threadId: string, inviteId: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const messages = useMemo(
    () => [...(activeThread?.messages || [])].sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)),
    [activeThread]
  );

  const handleSend = async () => {
    if (!activeThread || !text.trim()) return;
    setSending(true);
    try {
      await onSend(activeThread, text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleInvite = async () => {
    if (!activeThread) return;
    setSending(true);
    try {
      await onInvite(activeThread);
    } finally {
      setSending(false);
    }
  };

  if (!activeThread) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
        Pick a thread or start a new one to message another player.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col rounded-3xl border border-slate-200 bg-white">
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No messages yet.</div>
          ) : null}
          {messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm shadow-sm',
                    isCurrentUser ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <div className="font-semibold">{isCurrentUser ? 'You' : message.senderName}</div>
                  <div className="mt-1">{message.text}</div>
                  {message.invite ? (
                    <div className="mt-3 rounded-2xl border border-white/15 bg-black/10 p-3 text-xs">
                      <div className="font-semibold uppercase tracking-[0.16em]">Play Invite</div>
                      <div className="mt-1 capitalize">{message.invite.status}</div>
                      {message.invite.status === 'pending' && message.invite.recipientId === currentUserId ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3 rounded-full"
                          onClick={() => void onAcceptInvite(activeThread.id, message.invite!.id)}
                        >
                          Accept Invite
                        </Button>
                      ) : null}
                      {message.invite.gameId ? (
                        <Button asChild size="sm" variant="secondary" className="mt-3 rounded-full">
                          <Link href={`/game?game=${message.invite.gameId}`}>Open Game</Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex gap-2">
          <Button variant="outline" className="rounded-full" disabled={sending} onClick={() => void handleInvite()}>
            <Swords className="mr-2 h-4 w-4" />
            Invite to Play
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Send a direct message"
            disabled={sending}
          />
          <Button onClick={() => void handleSend()} disabled={sending || !text.trim()} size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardTaskbar({ hasUsersTurn, nextTurnHref, opponents }: DashboardTaskbarProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const { users } = useUsers();
  const { data: rawThreads, refresh } = useDirectThreads(Boolean(user));

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const retention = useMemo(() => normalizeRetentionState(userProfile?.retention), [userProfile?.retention]);
  const summary = useMemo(() => getRetentionSummary(retention), [retention]);
  const threads = useMemo(() => normalizeDirectThreads(rawThreads), [rawThreads]);
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [activeThreadId, threads]
  );
  const nextActionHref = hasUsersTurn ? nextTurnHref || '/dashboard' : getNextActionHref(retention, false);
  const nextActionLabel = hasUsersTurn ? 'Your turn' : summary.dailyChallengeCompleted ? 'Open arcade' : MODE_METADATA[summary.dailyChallenge.modeId].title;
  const questPercent = summary.totalQuestGoal > 0 ? Math.round((summary.totalQuestProgress / summary.totalQuestGoal) * 100) : 0;
  const unreadMessageCount = useMemo(
    () => threads.reduce((total, thread) => total + (user ? getThreadUnreadCount(thread, user.uid) : 0), 0),
    [threads, user]
  );
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
  const suggestedPlayers = useMemo(() => {
    const seen = new Set<string>();
    const items: OpponentSummary[] = [];
    for (const opponent of opponents) {
      if (opponent.uid !== user?.uid && !seen.has(opponent.uid)) {
        seen.add(opponent.uid);
        items.push(opponent);
      }
    }
    for (const profile of users) {
      if (profile.uid === user?.uid || seen.has(profile.uid)) continue;
      seen.add(profile.uid);
      items.push({
        uid: profile.uid,
        displayName: profile.displayName || profile.email || 'Player',
        photoURL: profile.photoURL || null,
        avatarPosterUrl: profile.avatarPosterUrl || null,
      });
      if (items.length >= 12) break;
    }
    return items;
  }, [opponents, user, users]);

  const openThread = async (recipientUserId: string) => {
    const response = await fetch('/api/direct-threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientUserId }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || 'Could not open direct messages.');
    }
    await refresh();
    setActiveThreadId(result.thread.id);
    setMessagesOpen(true);
  };

  const sendMessage = async (thread: DirectThread, text: string) => {
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(thread.id)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || 'Could not send message.');
    }
    await refresh();
  };

  const sendInvite = async (thread: DirectThread) => {
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(thread.id)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite: true }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || 'Could not send invite.');
    }
    await refresh();
  };

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

  const markRead = async (threadId: string) => {
    await fetch(`/api/direct-threads/${encodeURIComponent(threadId)}/read`, { method: 'POST' }).catch(() => null);
    await refresh().catch(() => null);
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

  useEffect(() => {
    if (!messagesOpen || !activeThread?.id) return;
    if ((user ? getThreadUnreadCount(activeThread, user.uid) : 0) > 0) {
      void markRead(activeThread.id);
    }
  }, [activeThread, messagesOpen, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="rounded-[2rem] border border-white/70 bg-white/88 p-3 shadow-[0_18px_46px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="grid gap-3 lg:grid-cols-[1.1fr,0.75fr,0.75fr,0.9fr]">
        <Link
          href={nextActionHref}
          className="group flex items-center justify-between rounded-[1.5rem] bg-slate-950 px-4 py-4 text-white transition-transform hover:-translate-y-0.5"
        >
          <div>
            <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/60">Next</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-black">
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
          <Badge className="rounded-full bg-white/12 text-white hover:bg-white/12">
            {hasUsersTurn ? 'Live' : 'Ready'}
          </Badge>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Quests</div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    {summary.completedQuests}/{summary.quests.length}
                  </div>
                </div>
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <Progress value={questPercent} className="mt-3 h-2" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>QUESTS</SheetTitle>
              <SheetDescription>Your compact daily progress view. Eligible daily rewards now auto-claim on clear.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className={`rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${MODE_METADATA[summary.dailyChallenge.modeId].accent} p-4`}>
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
                    {summary.rewardClaimedToday ? 'Auto-claimed today' : 'Auto-claims on your next eligible clear'}
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
                    <div key={quest.id} className="rounded-[1.25rem] border border-slate-200 p-4">
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
            <button type="button" className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Notifications</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{notificationCount}</div>
                </div>
                <motion.div
                  key={notificationCount}
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Bell className="h-5 w-5 text-sky-500" />
                </motion.div>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {hasUsersTurn ? 'Your game is ready.' : pendingInvites.length > 0 ? `${pendingInvites.length} invite${pendingInvites.length === 1 ? '' : 's'} waiting.` : 'All clear.'}
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>Your turn, invites, and quick status changes.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {hasUsersTurn ? (
                <Link href={nextActionHref} className="block rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
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
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => void handleSafe(() => acceptInvite(thread.id, message.invite!.id), 'Accept failed')}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!hasUsersTurn && pendingInvites.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 p-4 text-sm text-slate-500">No new notifications right now.</div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={messagesOpen} onOpenChange={setMessagesOpen}>
          <SheetTrigger asChild>
            <button type="button" className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-500">Messages</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{unreadMessageCount}</div>
                </div>
                <motion.div key={unreadMessageCount} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                  <MessageSquare className="h-5 w-5 text-violet-500" />
                </motion.div>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {threads[0]?.lastMessagePreview || 'Start a direct thread'}
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-screen max-w-[100vw] overflow-hidden p-0 sm:w-[calc(100vw-1rem)] sm:max-w-5xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b p-6 pr-14">
                <SheetTitle>Messages</SheetTitle>
                <SheetDescription>Direct messages and private play invites.</SheetDescription>
              </SheetHeader>
              <div className="grid h-[calc(100dvh-5rem)] min-h-0 gap-0 lg:grid-cols-[320px,minmax(0,1fr)]">
                <div className="min-h-0 border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
                  <Tabs defaultValue="threads" className="flex h-full min-h-0 flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="threads">Threads</TabsTrigger>
                      <TabsTrigger value="players">Players</TabsTrigger>
                    </TabsList>
                    <TabsContent value="threads" className="mt-4 min-h-0 flex-1">
                      <ScrollArea className="h-[32vh] lg:h-full">
                        <div className="space-y-2">
                          {threads.map((thread) => {
                            const counterpartId = user ? getThreadCounterpartId(thread, user.uid) : thread.participantIds[0];
                            const counterpart = thread.participantMeta[counterpartId];
                            const unread = user ? getThreadUnreadCount(thread, user.uid) : 0;
                            return (
                              <button
                                key={thread.id}
                                type="button"
                                className={cn(
                                  'w-full rounded-[1.25rem] border p-3 text-left transition',
                                  activeThread?.id === thread.id ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white/80'
                                )}
                                onClick={() => {
                                  setActiveThreadId(thread.id);
                                  void markRead(thread.id);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={counterpart?.avatarPosterUrl || counterpart?.photoURL || undefined} />
                                    <AvatarFallback>{(counterpart?.displayName || 'P').slice(0, 1)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="truncate font-black text-slate-900">{counterpart?.displayName || 'Player'}</div>
                                      {unread > 0 ? <Badge className="rounded-full">{unread}</Badge> : null}
                                    </div>
                                    <div className="truncate text-sm text-slate-500">{thread.lastMessagePreview || 'No messages yet'}</div>
                                    <div className="mt-1 text-xs text-slate-400">{formatThreadTime(thread)}</div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {threads.length === 0 ? (
                            <div className="rounded-[1.25rem] border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                              No threads yet.
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="players" className="mt-4 min-h-0 flex-1">
                      <ScrollArea className="h-[32vh] lg:h-full">
                        <div className="space-y-2">
                          {suggestedPlayers.map((player) => (
                            <button
                              key={player.uid}
                              type="button"
                              className="flex w-full items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white p-3 text-left"
                              onClick={() => void handleSafe(() => openThread(player.uid), 'Could not open thread')}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={player.avatarPosterUrl || player.photoURL || undefined} />
                                  <AvatarFallback>{player.displayName.slice(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div className="font-black text-slate-900">{player.displayName}</div>
                              </div>
                              <Plus className="h-4 w-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="min-h-0 min-w-0 p-4">
                  <MessageComposer
                    activeThread={activeThread}
                    currentUserId={user?.uid || ''}
                    onSend={(thread, text) => handleSafe(() => sendMessage(thread, text), 'Send failed')}
                    onInvite={(thread) => handleSafe(() => sendInvite(thread), 'Invite failed')}
                    onAcceptInvite={(threadId, inviteId) => handleSafe(() => acceptInvite(threadId, inviteId), 'Accept failed')}
                  />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.div>
  );
}
