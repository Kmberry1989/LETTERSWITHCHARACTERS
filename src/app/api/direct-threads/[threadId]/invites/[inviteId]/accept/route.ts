import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, newDocumentId, setDocument, updateDocument } from '@/lib/server/document-store';
import { createNewGame } from '@/lib/game/create-new-game';
import type { UserProfile } from '@/firebase/firestore/use-users';
import type { DirectThread } from '@/lib/direct-threads';
import { notifyUserChallenge } from '@/lib/server/turn-notifications';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string; inviteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId, inviteId } = await params;
  const thread = await getDocument<DirectThread>('directThreads', decodeURIComponent(threadId));
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
  }
  if (!thread.participantIds.includes(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messageIndex = (thread.messages || []).findIndex((message) => message.invite?.id === decodeURIComponent(inviteId));
  if (messageIndex < 0) {
    return NextResponse.json({ error: 'Invite not found.' }, { status: 404 });
  }

  const inviteMessage = thread.messages[messageIndex];
  const invite = inviteMessage.invite;
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found.' }, { status: 404 });
  }
  if (invite.recipientId !== user.uid) {
    return NextResponse.json({ error: 'Only the invited player can accept this invite.' }, { status: 403 });
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'This invite is no longer available.' }, { status: 409 });
  }

  const senderId = invite.senderId;
  const [senderProfile, recipientProfile] = await Promise.all([
    getDocument<UserProfile>('users', senderId),
    getDocument<UserProfile>('users', user.uid),
  ]);

  if (!senderProfile || !recipientProfile) {
    return NextResponse.json({ error: 'One of the player profiles is missing.' }, { status: 404 });
  }

  const gameId = newDocumentId();
  const gameData = createNewGame(senderId, user.uid, senderProfile, recipientProfile);

  await setDocument('games', gameId, gameData, false);
  await updateDocument('users', senderId, {
    gameIds: [...new Set([...(senderProfile.gameIds || []), gameId])],
  });
  await updateDocument('users', user.uid, {
    gameIds: [...new Set([...(recipientProfile.gameIds || []), gameId])],
  });

  const updatedMessages = [...thread.messages];
  updatedMessages[messageIndex] = {
    ...inviteMessage,
    invite: {
      ...invite,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      gameId,
    },
  };

  const acceptedMessage = {
    id: crypto.randomUUID(),
    senderId: user.uid,
    senderName: user.displayName || user.email || 'Player',
    text: 'Invite accepted',
    timestamp: new Date().toISOString(),
    invite: {
      ...invite,
      status: 'accepted' as const,
      acceptedAt: new Date().toISOString(),
      gameId,
    },
  };

  const updatedThread = await updateDocument('directThreads', thread.id, {
    messages: [...updatedMessages, acceptedMessage].slice(-200),
    unreadCounts: {
      ...(thread.unreadCounts || {}),
      [user.uid]: 0,
      [senderId]: (thread.unreadCounts?.[senderId] || 0) + 1,
    },
    lastMessagePreview: `${user.displayName || 'A player'} accepted your invite`,
    updatedAt: new Date().toISOString(),
  });

  await notifyUserChallenge({
    userId: senderId,
    title: 'Invite accepted',
    body: `${recipientProfile.displayName || 'A player'} accepted your play invite.`,
    challengeUrl: `${new URL(request.url).origin}/game?game=${gameId}`,
  });

  return NextResponse.json({ gameId, thread: updatedThread });
}
