import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { TILE_COSMETICS_BY_ID } from '@/lib/tile-cosmetics';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { shopItemSchema } from '@/lib/server/request-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'shop-equip', 30, 60_000);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const body = await parseJson(request, shopItemSchema);
    const item = TILE_COSMETICS_BY_ID[body.itemId];
    if (!item) throw new ApiRequestError('UNKNOWN_ITEM', 'Unknown tile set.', 400);
    const profile = normalizeUserCosmetics(await getDocument<any>('users', user.uid));
    if (!profile.ownedTileSetIds.includes(body.itemId)) throw new ApiRequestError('NOT_OWNED', 'Tile set not owned.', 403);
    const document = await updateDocument('users', user.uid, {
      equippedTileSetId: body.itemId,
      tileSetId: body.itemId,
      updatedAt: new Date().toISOString(),
    });
    return jsonOk({ document, equippedTileSetId: body.itemId }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not equip tile set.', 400), request);
  }
}
