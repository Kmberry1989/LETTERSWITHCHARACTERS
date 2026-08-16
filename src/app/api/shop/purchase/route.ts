import { getCurrentUser } from '@/lib/server/auth';
import { mutateDocumentAtomically } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { canAccessTileTier, TILE_COSMETICS_BY_ID } from '@/lib/tile-cosmetics';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { shopItemSchema } from '@/lib/server/request-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'shop-purchase', 20, 60_000);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const body = await parseJson(request, shopItemSchema);
    const item = TILE_COSMETICS_BY_ID[body.itemId];
    if (!item) throw new ApiRequestError('UNKNOWN_ITEM', 'Unknown tile set.', 400);
    const requestId = body.requestId || crypto.randomUUID();

    const mutation = await mutateDocumentAtomically('users', user.uid, (document) => {
      const profile = normalizeUserCosmetics(document as any);
      if (profile.ownedTileSetIds.includes(body.itemId)) {
        throw new ApiRequestError('ALREADY_OWNED', 'You already own this tile set.', 409);
      }
      if (!canAccessTileTier(profile.level || 1, body.itemId)) {
        throw new ApiRequestError('TIER_LOCKED', 'Your level is too low for this tile tier.', 403);
      }
      if (profile.berries < item.price) {
        throw new ApiRequestError('INSUFFICIENT_BERRIES', 'Not enough berries.', 400);
      }
      const nextBerries = profile.berries - item.price;
      const nextOwned = [...profile.ownedTileSetIds, body.itemId];
      return {
        patch: { berries: nextBerries, ownedTileSetIds: nextOwned, updatedAt: new Date().toISOString() },
        result: { purchasedItemId: body.itemId, berries: nextBerries, ownedTileSetIds: nextOwned },
        ledger: {
          requestId,
          kind: 'tile-set-purchase',
          currency: 'berries',
          amount: -item.price,
          balanceAfter: nextBerries,
          metadata: { itemId: body.itemId },
        },
      };
    }, { requestId });
    return jsonOk({ ...mutation.result, document: mutation.document }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not complete purchase.', 400), request);
  }
}
