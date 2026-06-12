'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Plus, Send, Sparkles, Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDirectThreads } from '@/hooks/use-direct-threads';
import { useUser, useUsers } from '@/firebase';
import type { DirectThread } from '@/lib/direct-threads';
import { getThreadCounterpartId, getThreadUnreadCount, normalizeDirectThreads } from '@/lib/direct-threads';
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

  const counterpartId = activeThread ? getThreadCounterpartId(activeThread, currentUserId) : null;
  const counterpart = counterpartId && activeThread ? activeThread.participantMeta[counterpartId] : null;

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
      <div className="glass-panel flex h-full min-h-[22rem] items-center justify-center rounded-[1.75rem] p-8 text-center">
        <div className="max-w-sm space-y-3">
          <div className="icon-badge mx-auto text-violet-500">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="text-xl font-black text-slate-950">No thread selected</div>
          <p className="text-sm text-slate-500">Pick a thread or start a new one from the players list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.75rem]">
      <div className="flex items-center gap-3 border-b border-white/70 p-4">
        <Avatar className="h-11 w-11 ring-4 ring-white/70">
          <AvatarImage src={counterpart?.avatarPosterUrl || counterpart?.photoURL || undefined} />
          <AvatarFallback>{(counterpart?.displayName || 'P').slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black text-slate-950">{counterpart?.displayName || 'Player'}</div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Direct thread</div>
        </div>
        <Button variant="outline" size="sm" disabled={sending} onClick={() => void handleInvite()}>
          <Swords className="h-4 w-4" />
          Invite
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {messages.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/55 p-4 text-sm text-slate-500">
              No messages yet. Send a quick hello or invite them to play.
            </div>
          ) : null}
          {messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[86%] break-words rounded-[1.35rem] px-4 py-3 text-sm shadow-sm',
                    isCurrentUser
                      ? 'bg-[linear-gradient(180deg,#111827,#020617)] text-white'
                      : 'border border-white/75 bg-white/80 text-slate-900'
                  )}
                >
                  <div className={cn('text-xs font-black uppercase tracking-[0.16em]', isCurrentUser ? 'text-white/60' : 'text-slate-400')}>
                    {isCurrentUser ? 'You' : message.senderName}
                  </div>
                  {message.text ? <div className="mt-1">{message.text}</div> : null}
                  {message.invite ? (
                    <div className={cn('mt-3 rounded-[1rem] border p-3 text-xs', isCurrentUser ? 'border-white/15 bg-white/10' : 'border-amber-200 bg-amber-50')}>
                      <div className="font-black uppercase tracking-[0.16em]">Play Invite</div>
                      <div className="mt-1 capitalize">{message.invite.status}</div>
                      {message.invite.status === 'pending' && message.invite.recipientId === currentUserId ? (
                        <Button
                          size="sm"
                          variant="reward"
                          className="mt-3"
                          onClick={() => void onAcceptInvite(activeThread.id, message.invite!.id)}
                        >
                          Accept Invite
                        </Button>
                      ) : null}
                      {message.invite.gameId ? (
                        <Button asChild size="sm" variant="outline" className="mt-3">
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

      <div className="border-t border-white/70 bg-white/45 p-3 sm:p-4">
        <div className="flex gap-2 rounded-[1.25rem] border border-white/75 bg-white/78 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.85)]">
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
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
  const { data: rawThreads, refresh } = useDirectThreads(Boolean(user));
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

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
        .map((profile) => ({
          uid: profile.uid,
          displayName: profile.displayName || profile.email || 'Player',
          photoURL: profile.photoURL || null,
          avatarPosterUrl: profile.avatarPosterUrl || null,
        }))
        .slice(0, 20),
    [users, user]
  );

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
    setOpen(true);
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

  useEffect(() => {
    if (!open || !activeThread?.id || !user) return;
    if (getThreadUnreadCount(activeThread, user.uid) > 0) {
      void markRead(activeThread.id);
    }
  }, [activeThread, open, user]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="fixed bottom-[5.85rem] right-4 z-40 h-14 w-14 rounded-[1.35rem] border-white/45 bg-[linear-gradient(180deg,#8d5cff,#6e46f2)] shadow-[inset_0_1px_0_rgba(255,255,255,.42),0_18px_36px_rgba(88,70,180,.28)] md:bottom-6 md:right-6"
          aria-label="Open direct messages"
        >
          <MessageSquare className="h-6 w-6" />
          <AnimatePresence>
            {unreadMessageCount > 0 ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[0.68rem] font-black text-white"
              >
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(255,201,71,.85)]" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-screen max-w-[100vw] overflow-hidden border-l-white/70 bg-[linear-gradient(135deg,rgba(247,251,241,.96),rgba(255,247,235,.96))] p-0 sm:w-[calc(100vw-1rem)] sm:max-w-5xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-white/70 bg-white/55 p-5 pr-14 backdrop-blur-xl sm:p-6 sm:pr-16">
            <div className="flex items-center gap-3">
              <div className="icon-badge text-violet-500">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black tracking-tight text-slate-950">Message Dock</SheetTitle>
                <SheetDescription>Quick DMs, player invites, and private match starts.</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="grid h-[calc(100dvh-6.75rem)] min-h-0 gap-0 lg:grid-cols-[340px,minmax(0,1fr)]">
            <div className="min-h-0 border-b border-white/70 bg-white/40 p-3 backdrop-blur-xl sm:p-4 lg:border-b-0 lg:border-r">
              <Tabs defaultValue="threads" className="flex h-full min-h-0 flex-col">
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-[1.25rem] bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.78)]">
                  <TabsTrigger value="threads" className="rounded-[1rem] font-black">Threads</TabsTrigger>
                  <TabsTrigger value="players" className="rounded-[1rem] font-black">Players</TabsTrigger>
                </TabsList>

                <TabsContent value="threads" className="mt-4 min-h-0 flex-1">
                  <ScrollArea className="h-[34vh] lg:h-full">
                    <div className="space-y-2 pr-1">
                      {threads.map((thread) => {
                        const counterpartId = user ? getThreadCounterpartId(thread, user.uid) : thread.participantIds[0];
                        const counterpart = thread.participantMeta[counterpartId];
                        const unread = user ? getThreadUnreadCount(thread, user.uid) : 0;
                        return (
                          <button
                            key={thread.id}
                            type="button"
                            className={cn(
                              'w-full rounded-[1.35rem] border p-3 text-left transition-all hover:-translate-y-0.5',
                              activeThread?.id === thread.id
                                ? 'pressed-card border-emerald-200'
                                : 'border-white/75 bg-white/70 shadow-[0_8px_18px_rgba(35,50,80,.06)]'
                            )}
                            onClick={() => {
                              setActiveThreadId(thread.id);
                              void markRead(thread.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11 ring-4 ring-white/65">
                                <AvatarImage src={counterpart?.avatarPosterUrl || counterpart?.photoURL || undefined} />
                                <AvatarFallback>{(counterpart?.displayName || 'P').slice(0, 1)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate font-black text-slate-900">{counterpart?.displayName || 'Player'}</div>
                                  {unread > 0 ? <Badge className="rounded-full bg-rose-500 hover:bg-rose-500">{unread}</Badge> : null}
                                </div>
                                <div className="truncate text-sm text-slate-500">{thread.lastMessagePreview || 'No messages yet'}</div>
                                <div className="mt-1 text-xs font-bold text-slate-400">{formatThreadTime(thread)}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {threads.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
                          No threads yet. Open the Players tab to start one.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="players" className="mt-4 min-h-0 flex-1">
                  <ScrollArea className="h-[34vh] lg:h-full">
                    <div className="space-y-2 pr-1">
                      {suggestedPlayers.map((player) => (
                        <button
                          key={player.uid}
                          type="button"
                          className="flex w-full items-center justify-between rounded-[1.35rem] border border-white/75 bg-white/72 p-3 text-left shadow-[0_8px_18px_rgba(35,50,80,.06)] transition-all hover:-translate-y-0.5 hover:bg-white/88"
                          onClick={() => void handleSafe(() => openThread(player.uid), 'Could not open thread')}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11 ring-4 ring-white/65">
                              <AvatarImage src={player.avatarPosterUrl || player.photoURL || undefined} />
                              <AvatarFallback>{player.displayName.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 truncate font-black text-slate-900">{player.displayName}</div>
                          </div>
                          <span className="icon-badge h-9 w-9 rounded-xl text-emerald-600">
                            <Plus className="h-4 w-4" />
                          </span>
                        </button>
                      ))}
                      {suggestedPlayers.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
                          No players available yet.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <div className="min-h-0 min-w-0 p-3 sm:p-4">
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
  );
}
