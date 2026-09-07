import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server/auth';
import { createNewGame } from '@/lib/game/create-new-game';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';

export const dynamic = 'force-dynamic';
const schema = z.object({ difficulty: z.enum(['Easy', 'Medium', 'Hard']) }).strict();
const botId = 'bitty-botty-001';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    enforceRateLimit(request, `bot-create:${user.uid}`, 10, 60_000);
    const { difficulty } = await parseJson(request, schema);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const gameId = await prisma.$transaction(async (transaction) => {
          const row = await transaction.appDocument.findUnique({ where: { collection_documentId: { collection: 'users', documentId: user.uid } } });
          if (!row) throw new ApiRequestError('NOT_FOUND', 'Profile not found.', 404);
          const profile = row.data as unknown as UserProfile;
          const existing = await transaction.appDocument.findFirst({ where: {
            collection: 'games', AND: [
              { data: { path: ['players'], array_contains: [user.uid, botId] } },
              { data: { path: ['status'], equals: 'active' } },
            ],
          } });
          if (existing) throw new ApiRequestError('ACTIVE_BOT_GAME', 'You already have an active game against Bitty Botty.', 409);
          const gameId = crypto.randomUUID();
          const game = createNewGame(user.uid, botId, profile, {
            uid: botId, displayName: 'Bitty Botty', avatarId: 'avatar-base',
            avatarPresetId: 'ember-scribe', avatarPosterUrl: '/avatars/posters/ember-scribe.svg', equippedTileSetId: 'tile-minimalist',
          });
          await transaction.appDocument.create({ data: { collection: 'games', documentId: gameId, data: { ...game, difficulty } as unknown as Prisma.InputJsonValue } });
          await transaction.appDocument.update({ where: { id: row.id }, data: { data: {
            ...(row.data as Prisma.JsonObject), gameIds: [...new Set([...(profile.gameIds || []), gameId])],
          } as Prisma.InputJsonValue } });
          return gameId;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return jsonOk({ gameId }, request);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
        throw error;
      }
    }
    throw new ApiRequestError('CONFLICT', 'Please try again.', 409);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not create bot game.'), request);
  }
}
