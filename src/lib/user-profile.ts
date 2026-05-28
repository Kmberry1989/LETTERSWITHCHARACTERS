import {
  normalizeOwnedTileSetIds,
  resolveEquippedTileSetId,
  STARTER_BERRIES,
} from '@/lib/tile-cosmetics';

export type CosmeticUserProfile = {
  berries?: number;
  ownedTileSetIds?: string[];
  equippedTileSetId?: string;
  tileSetId?: string;
};

export function normalizeUserCosmetics<T extends CosmeticUserProfile>(profile: T | null | undefined) {
  const safeProfile = (profile || {}) as T;
  const equippedTileSetId = resolveEquippedTileSetId(safeProfile.tileSetId, safeProfile.equippedTileSetId);
  const ownedTileSetIds = normalizeOwnedTileSetIds([
    ...(safeProfile.ownedTileSetIds || []),
    safeProfile.tileSetId || equippedTileSetId,
  ]);

  return {
    ...safeProfile,
    berries: typeof safeProfile.berries === 'number' ? safeProfile.berries : STARTER_BERRIES,
    ownedTileSetIds,
    equippedTileSetId: ownedTileSetIds.includes(equippedTileSetId)
      ? equippedTileSetId
      : ownedTileSetIds[0],
  };
}
