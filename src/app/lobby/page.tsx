'use client';

import { useEffect, useMemo } from 'react';
import { addDoc, collection, doc, getDoc, limit, orderBy, query, runTransaction, serverTimestamp } from '@/lib/client/document-client';
import AppLayout from '@/components/app-layout';
import LobbyChat, { type LobbyMessage } from '@/components/lobby/lobby-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createTileBag, drawTiles } from '@/lib/game-logic';
import type { Tile } from '@/lib/game/types';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import { usePlayableGate } from '@/hooks/use-playable-gate';
import { normalizeUserCosmetics } from '@/lib/user-profile';

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

type PlayerData = {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
  avatarPresetId?: string | null;
  avatarPosterUrl?: string | null;
  equippedTileSetId?: string | null;
  tiles: Tile[];
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
    <Card>
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
              <div key={challenge.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
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

  const buildNewGame = (creatorUid: string, accepterUid: string, creatorProfile: UserProfile, accepterProfile: UserProfile) => {
    const creatorCosmetics = normalizeUserCosmetics(creatorProfile);
    const accepterCosmetics = normalizeUserCosmetics(accepterProfile);
    let tileBag = createTileBag();
    const [creatorTiles, tileBagAfterCreator] = drawTiles(tileBag, 7);
    const [accepterTiles, finalTileBag] = drawTiles(tileBagAfterCreator, 7);
    tileBag = finalTileBag;

    const playerData: Record<string, PlayerData> = {
      [creatorUid]: {
        displayName: creatorProfile.displayName || creatorProfile.email || 'Player One',
        score: 0,
        avatarId: creatorProfile.avatarId || 'user-1',
        photoURL: creatorProfile.photoURL || null,
        avatarPresetId: creatorProfile.avatarPresetId || null,
        avatarPosterUrl: creatorProfile.avatarPosterUrl || null,
        equippedTileSetId: creatorCosmetics.equippedTileSetId,
        tiles: creatorTiles,
      },
      [accepterUid]: {
        displayName: accepterProfile.displayName || accepterProfile.email || 'Player Two',
        score: 0,
        avatarId: accepterProfile.avatarId || 'user-1',
        photoURL: accepterProfile.photoURL || null,
        avatarPresetId: accepterProfile.avatarPresetId || null,
        avatarPosterUrl: accepterProfile.avatarPosterUrl || null,
        equippedTileSetId: accepterCosmetics.equippedTileSetId,
        tiles: accepterTiles,
      },
    };

    return {
      players: [creatorUid, accepterUid],
      playerData,
      board: {},
      tileBag,
      currentTurn: creatorUid,
      status: 'active' as const,
      consecutivePasses: 0,
      messages: [],
    };
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
      const gameId = await runTransaction(null, async (transaction) => {
        const challengeRef = doc(null, 'lobbyChallenges', challengeId);
        const challengeSnap = await transaction.get(challengeRef);

        if (!challengeSnap.exists()) {
          throw new Error('This challenge no longer exists.');
        }

        const challenge = { id: challengeSnap.id, ...challengeSnap.data() } as Challenge;
        if (challenge.status !== 'open') {
          throw new Error('This challenge has already been accepted.');
        }
        if (challenge.creatorUid === user.uid) {
          throw new Error('You cannot accept your own challenge.');
        }

        const creatorUserRef = doc(null, 'users', challenge.creatorUid);
        const accepterUserRef = doc(null, 'users', user.uid);
        const creatorUserSnap = await transaction.get(creatorUserRef);
        const accepterUserSnap = await transaction.get(accepterUserRef);

        if (!creatorUserSnap.exists() || !accepterUserSnap.exists()) {
          throw new Error('One of the player profiles is missing.');
        }

        const creatorProfile = creatorUserSnap.data() as UserProfile;
        const accepterProfile = accepterUserSnap.data() as UserProfile;
        const gameRef = doc(collection(null, 'games'));
        const gameData = buildNewGame(challenge.creatorUid, user.uid, creatorProfile, accepterProfile);

        await transaction.set(gameRef, gameData);
        await transaction.update(creatorUserRef, {
          gameIds: [...new Set([...(creatorProfile.gameIds || []), gameRef.id])],
        });
        await transaction.update(accepterUserRef, {
          gameIds: [...new Set([...(accepterProfile.gameIds || []), gameRef.id])],
        });
        await transaction.update(challengeRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedByUid: user.uid,
          gameId: gameRef.id,
        });

        return gameRef.id;
      });

      toast({ title: 'Challenge Accepted', description: 'Opening your new game.' });
      window.location.href = `/game?game=${gameId}`;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Accept Failed', description: error.message || 'Could not accept this challenge.' });
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Game Lobby</h1>
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
