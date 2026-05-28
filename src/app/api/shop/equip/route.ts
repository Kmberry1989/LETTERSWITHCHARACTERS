import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { TILE_COSMETICS_BY_ID } from '@/lib/tile-cosmetics';

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
  if (!profile.ownedTileSetIds.includes(itemId)) {
    return NextResponse.json({ error: 'Tile set not owned.' }, { status: 403 });
  }

  const document = await updateDocument('users', user.uid, {
    equippedTileSetId: itemId,
    tileSetId: itemId,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    document,
    equippedTileSetId: itemId,
  });
}
