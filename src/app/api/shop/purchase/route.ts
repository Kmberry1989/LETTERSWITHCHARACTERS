import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { canAccessTileTier, TILE_COSMETICS_BY_ID } from '@/lib/tile-cosmetics';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const itemId = String(body?.itemId || '');
  const item = TILE_COSMETICS_BY_ID[itemId];

  if (!item) {
    return NextResponse.json({ error: 'Unknown tile set.' }, { status: 400 });
  }

  const profile = normalizeUserCosmetics(await getDocument<any>('users', user.uid));
  if (profile.ownedTileSetIds.includes(itemId)) {
    return NextResponse.json({ error: 'You already own this tile set.' }, { status: 409 });
  }

  if (!canAccessTileTier(profile.level || 1, itemId)) {
    return NextResponse.json({ error: 'Your level is too low for this tile tier.' }, { status: 403 });
  }

  if ((profile.berries || 0) < item.price) {
    return NextResponse.json({ error: 'Not enough berries.' }, { status: 400 });
  }

  const nextOwned = [...profile.ownedTileSetIds, itemId];
  const nextBerries = (profile.berries || 0) - item.price;

  const document = await updateDocument('users', user.uid, {
    berries: nextBerries,
    ownedTileSetIds: nextOwned,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    document,
    purchasedItemId: itemId,
    berries: nextBerries,
    ownedTileSetIds: nextOwned,
  });
}
