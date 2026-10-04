import { z } from 'zod';
import { getAdminFirestore } from '@/firebase/admin';
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
    const db = getAdminFirestore();
    const gameId = await db.runTransaction(async (transaction) => {
          const profileRef = db.collection('users').doc(user.uid);
          const profileSnapshot = await transaction.get(profileRef);
          if (!profileSnapshot.exists) throw new ApiRequestError('NOT_FOUND', 'Profile not found.', 404);
          const profile = profileSnapshot.data() as UserProfile;
          const gamesSnapshot = await transaction.get(db.collection('games').where('players', 'array-contains', user.uid));
          const existing = gamesSnapshot.docs.some((doc) => {
            const game = doc.data();
            return game.status === 'active' && Array.isArray(game.players) && game.players.includes(botId);
          });
          if (existing) throw new ApiRequestError('ACTIVE_BOT_GAME', 'You already have an active game against Bitty Botty.', 409);
          const nextGameId = db.collection('games').doc().id;
          const game = createNewGame(user.uid, botId, profile, {
            uid: botId, displayName: 'Bitty Botty', avatarId: 'avatar-base',
            avatarPresetId: 'ember-scribe', avatarPosterUrl: '/avatars/posters/ember-scribe.svg', equippedTileSetId: 'tile-minimalist',
          });
          transaction.create(db.collection('games').doc(nextGameId), { ...game, difficulty });
          transaction.update(profileRef, { gameIds: [...new Set([...(profile.gameIds || []), nextGameId])] });
          return nextGameId;
    });
    return jsonOk({ gameId }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not create bot game.'), request);
  }
}
