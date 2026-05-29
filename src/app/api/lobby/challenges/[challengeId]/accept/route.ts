import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import {
  getDocument,
  newDocumentId,
  setDocument,
  updateDocument,
} from '@/lib/server/document-store';
import { createNewGame } from '@/lib/game/create-new-game';
import type { UserProfile } from '@/firebase/firestore/use-users';

type Challenge = {
  id: string;
  creatorUid: string;
  status: 'open' | 'accepted';
  acceptedByUid?: string;
  gameId?: string;
};

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { challengeId } = await params;
  const decodedChallengeId = decodeURIComponent(challengeId);
  const challenge = await getDocument<Challenge>('lobbyChallenges', decodedChallengeId);

  if (!challenge) {
    return NextResponse.json({ error: 'This challenge no longer exists.' }, { status: 404 });
  }
  if (challenge.status !== 'open') {
    return NextResponse.json({ error: 'This challenge has already been accepted.' }, { status: 409 });
  }
  if (challenge.creatorUid === user.uid) {
    return NextResponse.json({ error: 'You cannot accept your own challenge.' }, { status: 400 });
  }

  const creatorProfile = await getDocument<UserProfile>('users', challenge.creatorUid);
  const accepterProfile = await getDocument<UserProfile>('users', user.uid);
  if (!creatorProfile || !accepterProfile) {
    return NextResponse.json({ error: 'One of the player profiles is missing.' }, { status: 404 });
  }

  const latestChallenge = await getDocument<Challenge>('lobbyChallenges', decodedChallengeId);
  if (!latestChallenge || latestChallenge.status !== 'open') {
    return NextResponse.json({ error: 'This challenge has already been accepted.' }, { status: 409 });
  }

  const gameId = newDocumentId();
  const gameData = createNewGame(challenge.creatorUid, user.uid, creatorProfile, accepterProfile);

  await setDocument('games', gameId, gameData, false);
  await updateDocument('users', challenge.creatorUid, {
    gameIds: [...new Set([...(creatorProfile.gameIds || []), gameId])],
  });
  await updateDocument('users', user.uid, {
    gameIds: [...new Set([...(accepterProfile.gameIds || []), gameId])],
  });
  await updateDocument('lobbyChallenges', decodedChallengeId, {
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
    acceptedByUid: user.uid,
    gameId,
  });

  return NextResponse.json({ gameId });
}
