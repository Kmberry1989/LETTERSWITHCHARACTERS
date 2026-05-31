'use client';

import { useEffect, useMemo } from 'react';
import { addDoc, collection, doc, getDoc, limit, orderBy, query, serverTimestamp } from '@/lib/client/document-client';
import AppLayout from '@/components/app-layout';
import LobbyChat, { type LobbyMessage } from '@/components/lobby/lobby-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import { usePlayableGate } from '@/hooks/use-playable-gate';
import { Sparkles, Swords, Wand2 } from 'lucide-react';

type LocalTimestamp = Date | string | { toDate: () => Date };

type Challenge = {
  id: string;
  creatorUid: string;
  creatorDisplayName: string;
  creatorAvatarId?: string;
  creatorPhotoURL?: string | null;
  creatorAvatarPosterUrl?: string | null;
  status: 'open' | 'accepted';
  createdAt?: LocalTimestamp;
  acceptedAt?: LocalTimestamp;
  acceptedByUid?: string;
  gameId?: string;
};

function OpenChallenges({
  challenges,
  currentUserId,
  onCreateChallenge,
  onAcceptChallenge,
  isBusy,
}: {
  challenges: Challenge[];
  currentUserId?: string;
  onCreateChallenge: () => void;
  onAcceptChallenge: (challengeId: string) => void;
  isBusy: boolean;
}) {
  return (
    <Card className="overflow-hidden border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,246,233,0.92))] shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <CardTitle>Open Challenges</CardTitle>
        <CardDescription>Create a challenge or accept one from another player.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" onClick={onCreateChallenge} disabled={!currentUserId || isBusy}>
          {isBusy ? 'Working...' : 'Create Open Challenge'}
        </Button>
        <div className="space-y-3">
          {challenges.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No open challenges yet.
            </div>
          )}
          {challenges.map((challenge) => {
            const isOwn = challenge.creatorUid === currentUserId;
            const creatorAvatar = resolveAvatarImage({
              avatarPosterUrl: challenge.creatorAvatarPosterUrl,
              photoURL: challenge.creatorPhotoURL,
            });
            return (
              <div key={challenge.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-white/75 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={creatorAvatar || undefined} />
                    <AvatarFallback>{challenge.creatorDisplayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{challenge.creatorDisplayName}</div>
                    <Badge variant="outline" className="mt-1">Open</Badge>
                  </div>
                </div>
                <Button size="sm" disabled={!currentUserId || isOwn || isBusy} onClick={() => onAcceptChallenge(challenge.id)}>
                  {isOwn ? 'Your Challenge' : 'Accept'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LobbyPage() {
  const { user, canPlay } = usePlayableGate();
  const { toast } = useToast();

  const messagesQuery = useMemoFirebase(() => {
    return query(collection(null, 'lobbyMessages'), orderBy('timestamp', 'desc'), limit(50));
  }, []);

  const challengesQuery = useMemoFirebase(() => {
    return query(collection(null, 'lobbyChallenges'), orderBy('createdAt', 'desc'), limit(25));
  }, []);

  const { data: messages, isLoading } = useCollection<LobbyMessage>(messagesQuery);
  const { data: rawChallenges, isLoading: isChallengesLoading } = useCollection<Challenge>(challengesQuery);
  const sortedMessages = useMemo(() => messages?.slice().reverse() || [], [messages]);
  const openChallenges = useMemo(
    () => (rawChallenges || []).filter((challenge) => challenge.status === 'open'),
    [rawChallenges]
  );

  const handleSendMessage = async (text: string) => {
    if (!user) return;

    const lobbyMessagesCol = collection(null, 'lobbyMessages');
    const newMessage = {
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      senderPhotoURL: user.photoURL || null,
      text,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(lobbyMessagesCol, newMessage);
    } catch {
      toast({ variant: 'destructive', title: 'Send Failed', description: 'Could not send your lobby message.' });
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) return;
    if (!canPlay) return;
    const userDocRef = doc(null, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userProfile = userDocSnap.data() as UserProfile | undefined;

    if (!userProfile) {
      toast({
        variant: 'destructive',
        title: 'Profile Missing',
        description: 'Sign in again to create your player profile before creating a challenge.',
      });
      return;
    }

    if (openChallenges.some((challenge) => challenge.creatorUid === user.uid)) {
      toast({
        variant: 'destructive',
        title: 'Challenge Already Open',
        description: 'You already have an open challenge in the lobby.',
      });
      return;
    }

    const payload = {
      creatorUid: user.uid,
      creatorDisplayName: userProfile.displayName || userProfile.email || 'Anonymous',
      creatorAvatarId: userProfile.avatarId || 'user-1',
      creatorPhotoURL: userProfile.photoURL || null,
      creatorAvatarPosterUrl: userProfile.avatarPosterUrl || null,
      status: 'open' as const,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(null, 'lobbyChallenges'), payload);
      toast({ title: 'Challenge Created', description: 'Your challenge is now visible to other players.' });
    } catch {
      toast({ variant: 'destructive', title: 'Create Failed', description: 'Could not create your challenge.' });
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/lobby/challenges/${encodeURIComponent(challengeId)}/accept`, {
        method: 'POST',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not accept this challenge.');
      }
      const gameId = result?.gameId as string;

      toast({ title: 'Challenge Accepted', description: 'Opening your new game.' });
      window.location.href = `/game?game=${gameId}`;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Accept Failed', description: error.message || 'Could not accept this challenge.' });
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,249,237,0.96),rgba(255,232,214,0.96))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Matchmaking
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight font-headline">Game Lobby</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">Chat, post an open challenge, or jump directly into the next playful word duel.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-2 font-semibold"><Swords className="h-4 w-4 text-primary" />Open Matches</div><div className="mt-1 text-sm text-muted-foreground">{openChallenges.length} ready to accept</div></div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-2 font-semibold"><Wand2 className="h-4 w-4 text-primary" />Live Chat</div><div className="mt-1 text-sm text-muted-foreground">{sortedMessages.length} recent lobby messages</div></div>
            </div>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <LobbyChat
              messages={sortedMessages}
              onSendMessage={handleSendMessage}
              currentUser={user}
              isLoading={isLoading}
            />
          </div>
          <div className="md:col-span-1">
            <OpenChallenges
              challenges={openChallenges}
              currentUserId={user?.uid}
              onCreateChallenge={handleCreateChallenge}
              onAcceptChallenge={handleAcceptChallenge}
              isBusy={isChallengesLoading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
