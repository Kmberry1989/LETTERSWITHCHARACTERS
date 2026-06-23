import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server/auth';
import { serializeForJson } from '@/lib/server/document-store';
import { createNewGame } from '@/lib/game/create-new-game';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { notifyUserChallenge } from '@/lib/server/turn-notifications';

type Challenge = {
  id: string;
  creatorUid: string;
  status: 'open' | 'accepted';
  acceptedByUid?: string;
  gameId?: string;
};

type DocumentRecord<T> = {
  collection: string;
  documentId: string;
  data: T;
};

class AcceptChallengeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AcceptChallengeError';
  }
}

export const dynamic = 'force-dynamic';

function documentData<T>(record: DocumentRecord<T>) {
  return { id: record.documentId, ...(record.data as any) } as T & { id: string };
}

function appendGameId(profileData: any, gameId: string) {
  return [...new Set([...(Array.isArray(profileData?.gameIds) ? profileData.gameIds : []), gameId])];
}

function profileUpdateData(profileData: any, gameId: string) {
  const nextData = {
    ...(profileData || {}),
    gameIds: appendGameId(profileData, gameId),
    updatedAt: new Date().toISOString(),
  };

  delete nextData.id;
  return serializeForJson(nextData);
}

function challengeUpdateData(challengeData: any, userId: string, gameId: string) {
  const nextData = {
    ...(challengeData || {}),
    status: 'accepted' as const,
    acceptedAt: new Date().toISOString(),
    acceptedByUid: userId,
    gameId,
  };

  delete nextData.id;
  return serializeForJson(nextData);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { challengeId } = await params;
  const decodedChallengeId = decodeURIComponent(challengeId);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const challengeRecord = await tx.appDocument.findUnique({
          where: {
            collection_documentId: {
              collection: 'lobbyChallenges',
              documentId: decodedChallengeId,
            },
          },
        }) as DocumentRecord<Challenge> | null;

        if (!challengeRecord) {
          throw new AcceptChallengeError(404, 'This challenge no longer exists.');
        }

        const challenge = documentData<Challenge>(challengeRecord);

        if (challenge.status !== 'open') {
          throw new AcceptChallengeError(409, 'This challenge has already been accepted.');
        }

        if (challenge.creatorUid === user.uid) {
          throw new AcceptChallengeError(400, 'You cannot accept your own challenge.');
        }

        const [creatorRecord, accepterRecord] = await Promise.all([
          tx.appDocument.findUnique({
            where: {
              collection_documentId: {
                collection: 'users',
                documentId: challenge.creatorUid,
              },
            },
          }),
          tx.appDocument.findUnique({
            where: {
              collection_documentId: {
                collection: 'users',
                documentId: user.uid,
              },
            },
          }),
        ]) as Array<DocumentRecord<UserProfile> | null>;

        if (!creatorRecord || !accepterRecord) {
          throw new AcceptChallengeError(404, 'One of the player profiles is missing.');
        }

        const creatorProfile = documentData<UserProfile>(creatorRecord);
        const accepterProfile = documentData<UserProfile>(accepterRecord);
        const gameId = crypto.randomUUID();
        const gameData = createNewGame(challenge.creatorUid, user.uid, creatorProfile, accepterProfile);

        await tx.appDocument.create({
          data: {
            collection: 'games',
            documentId: gameId,
            data: serializeForJson(gameData),
          },
        });

        await tx.appDocument.update({
          where: {
            collection_documentId: {
              collection: 'users',
              documentId: challenge.creatorUid,
            },
          },
          data: {
            data: profileUpdateData(creatorRecord.data, gameId),
          },
        });

        await tx.appDocument.update({
          where: {
            collection_documentId: {
              collection: 'users',
              documentId: user.uid,
            },
          },
          data: {
            data: profileUpdateData(accepterRecord.data, gameId),
          },
        });

        await tx.appDocument.update({
          where: {
            collection_documentId: {
              collection: 'lobbyChallenges',
              documentId: decodedChallengeId,
            },
          },
          data: {
            data: challengeUpdateData(challengeRecord.data, user.uid, gameId),
          },
        });

        return {
          gameId,
          creatorUid: challenge.creatorUid,
          accepterDisplayName: accepterProfile.displayName || 'A player',
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    await notifyUserChallenge({
      userId: result.creatorUid,
      title: 'Challenge accepted',
      body: `${result.accepterDisplayName} accepted your challenge.`,
      challengeUrl: `${new URL(request.url).origin}/game?game=${result.gameId}`,
    }).catch((error) => {
      console.error('Challenge acceptance notification failed:', error);
    });

    return NextResponse.json({ gameId: result.gameId });
  } catch (error: any) {
    if (error instanceof AcceptChallengeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error?.code === 'P2034') {
      return NextResponse.json(
        { error: 'This challenge was accepted by another player. Refresh the lobby and choose another challenge.' },
        { status: 409 }
      );
    }

    console.error('Challenge acceptance failed:', error);
    return NextResponse.json({ error: 'Could not accept this challenge.' }, { status: 500 });
  }
}
