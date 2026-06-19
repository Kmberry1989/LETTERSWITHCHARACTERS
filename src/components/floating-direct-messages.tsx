'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Send, Swords } from 'lucide-react';
import { useUser, useUsers } from '@/firebase';
import type { DirectThread } from '@/lib/direct-threads';
import { getThreadCounterpartId, getThreadUnreadCount, normalizeDirectThreads } from '@/lib/direct-threads';
import { useDirectThreads } from '@/hooks/use-direct-threads';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAudio } from '@/hooks/use-audio';
import { cn } from '@/lib/utils';

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
      <div className="glass-panel flex h-full min-h-[24rem] items-center justify-center rounded-[1.75rem] p-8 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.72] shadow-sm">
            <MessageSquare className="h-6 w-6 text-emerald-700" />
          </div>
          <div className="mt-4 text-xl font-black text-slate-950">No thread selected</div>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Pick a conversation or start a new one from the player list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.75rem]">
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4 sm:p-5">
          {messages.length === 0 ? <div className="rounded-2xl bg-white/[.72] p-4 text-sm text-slate-500">No messages yet.</div> : null}
          {messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[86%] break-words rounded-[1.35rem] px-4 py-3 text-sm shadow-sm',
                    isCurrentUser
                      ? 'bg-[linear-gradient(180deg,#111827,#020617)] text-white'
                      : 'border border-white/[.72] bg-white/[.82] text-slate-900'
                  )}
                >
                  <div className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{isCurrentUser ? 'You' : message.senderName}</div>
                  {message.text ? <div className="mt-1.5">{message.text}</div> : null}
                  {message.invite ? (
                    <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs">
                      <div className="font-black uppercase tracking-[0.16em]">Play Invite</div>
                      <div className="mt-1 capitalize opacity-80">{message.invite.status}</div>
                      {message.invite.status === 'pending' && message.invite.recipientId === currentUserId ? (
                        <Button
                          size="sm"
                          variant="reward"
                          className="mt-3 rounded-full"
                          onClick={() => void onAcceptInvite(activeThread.id, message.invite!.id)}
                        >
                          Accept Invite
                        </Button>
                      ) : null}
                      {message.invite.gameId ? (
                        <Button asChild size="sm" variant="glass" className="mt-3 rounded-full">
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
      <div className="border-t border-white/[.72] bg-white/[.62] p-4 backdrop-blur-xl">
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
            className="h-11 rounded-2xl border-white/[.72] bg-white/[.82] shadow-sm"
          />
          <Button onClick={() => void handleSend()} disabled={sending || !text.trim()} size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FloatingDirectMessages() {
  const { user } = useUser();
  const { users } = useUsers();
  const { toast } = useToast();
  const { playSfx } = useAudio();
  const { data: rawThreads, refresh } = useDirectThreads(Boolean(user));
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const previousUnreadCountRef = useRef(0);
  const hasSeenUnreadRef = useRef(false);

  const threads = useMemo(() => normalizeDirectThreads(rawThreads), [rawThreads]);
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [activeThreadId, threads]
  );
  const unreadMessageCount = useMemo(
    () => threads.reduce((total, thread) => total + (user ? getThreadUnreadCount(thread, user.uid) : 0), 0),
    [threads, user]
  );
  const suggestedPlayers = useMemo(
    () =>
      users
        .filter((profile) => profile.uid !== user?.uid)
        .slice(0, 16)
        .map((profile) => ({
          uid: profile.uid,
          displayName: profile.displayName || profile.email || 'Player',
          photoURL: profile.photoURL || null,
          avatarPosterUrl: profile.avatarPosterUrl || null,
        })),
    [users, user]
  );

  const openThread = async (recipientUserId: string) => {
    const response = await fetch('/api/direct-threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientUserId }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Could not open direct messages.');
    await refresh();
    setActiveThreadId(result.thread.id);
    setOpen(true);
  };

  const sendMessage = async (thread: DirectThread, text: string) => {
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(thread.id)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Could not send message.');
    await refresh();
  };

  const sendInvite = async (thread: DirectThread) => {
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(thread.id)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite: true }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Could not send invite.');
    await refresh();
  };

  const acceptInvite = async (threadId: string, inviteId: string) => {
    const response = await fetch(`/api/direct-threads/${encodeURIComponent(threadId)}/invites/${encodeURIComponent(inviteId)}/accept`, {
      method: 'POST',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Could not accept invite.');
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
    if (!open || !activeThread?.id || !user) return;
    if (getThreadUnreadCount(activeThread, user.uid) > 0) void markRead(activeThread.id);
  }, [activeThread, open, user]);

  useEffect(() => {
    if (!user) {
      hasSeenUnreadRef.current = false;
      previousUnreadCountRef.current = 0;
      return;
    }

    if (hasSeenUnreadRef.current && unreadMessageCount > previousUnreadCountRef.current) {
      playSfx('lobbyNotification');
    }

    hasSeenUnreadRef.current = true;
    previousUnreadCountRef.current = unreadMessageCount;
  }, [playSfx, unreadMessageCount, user]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button
          type="button"
          aria-label="Open direct messages"
          className="floating-dock-button fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-[1.35rem] text-slate-950 transition-transform hover:-translate-y-1 md:bottom-6 md:right-6"
          whileTap={{ scale: 0.96 }}
        >
          <MessageSquare className="h-6 w-6 text-emerald-700" />
          {unreadMessageCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--lwc-berry)] px-1.5 text-[0.68rem] font-black text-white shadow-lg">
              {unreadMessageCount}
            </span>
          ) : null}
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-[100vw] overflow-hidden border-l-white/[.72] bg-[linear-gradient(135deg,rgba(255,255,255,.94),rgba(241,249,236,.9))] p-0 sm:w-[calc(100vw-1rem)] sm:max-w-5xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-white/[.72] bg-white/[.58] p-5 pr-14 text-left backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-3">
              <div className="icon-badge h-12 w-12">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black tracking-tight">Messages</SheetTitle>
                <SheetDescription>Direct threads, quick play invites, and player lookup.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="grid h-[calc(100dvh-5.75rem)] min-h-0 gap-0 lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-white/[.72] bg-white/[.38] p-4 backdrop-blur-xl lg:border-b-0 lg:border-r">
              <Tabs defaultValue="threads" className="flex h-full min-h-0 flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/[.72] p-1.5">
                  <TabsTrigger value="threads" className="rounded-xl font-black">Threads</TabsTrigger>
                  <TabsTrigger value="players" className="rounded-xl font-black">Players</TabsTrigger>
                </TabsList>
                <TabsContent value="threads" className="mt-4 min-h-0 flex-1">
                  <ScrollArea className="h-[34vh] lg:h-full">
                    <div className="space-y-2 pr-2">
                      {threads.map((thread) => {
                        const counterpartId = getThreadCounterpartId(thread, user.uid);
                        const counterpart = thread.participantMeta[counterpartId];
                        const unread = getThreadUnreadCount(thread, user.uid);
                        return (
                          <button
                            key={thread.id}
                            type="button"
                            className={cn(
                              'w-full rounded-[1.35rem] border p-3 text-left transition-all',
                              activeThread?.id === thread.id
                                ? 'pressed-surface border-emerald-200 text-slate-950'
                                : 'border-white/[.72] bg-white/[.72] hover:-translate-y-0.5 hover:bg-white/[.88]'
                            )}
                            onClick={() => {
                              setActiveThreadId(thread.id);
                              void markRead(thread.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11 border border-white/[.78] shadow-sm">
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
                      {threads.length === 0 ? <div className="rounded-[1.25rem] border border-dashed border-slate-200 p-4 text-sm text-slate-500">No threads yet.</div> : null}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="players" className="mt-4 min-h-0 flex-1">
                  <ScrollArea className="h-[34vh] lg:h-full">
                    <div className="space-y-2 pr-2">
                      {suggestedPlayers.map((player) => (
                        <button
                          key={player.uid}
                          type="button"
                          className="flex w-full items-center justify-between rounded-[1.35rem] border border-white/[.72] bg-white/[.72] p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[.88]"
                          onClick={() => void handleSafe(() => openThread(player.uid), 'Could not open thread')}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11 border border-white/[.78] shadow-sm">
                              <AvatarImage src={player.avatarPosterUrl || player.photoURL || undefined} />
                              <AvatarFallback>{player.displayName.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 truncate font-black text-slate-900">{player.displayName}</div>
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
                currentUserId={user.uid}
                onSend={(thread, text) => handleSafe(() => sendMessage(thread, text), 'Send failed')}
                onInvite={(thread) => handleSafe(() => sendInvite(thread), 'Invite failed')}
                onAcceptInvite={(threadId, inviteId) => handleSafe(() => acceptInvite(threadId, inviteId), 'Accept failed')}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
