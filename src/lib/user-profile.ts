import { getLevelForExperience } from '@/lib/tile-cosmetics';
import {
  normalizeOwnedTileSetIds,
  resolveEquippedTileSetId,
  STARTER_BERRIES,
} from '@/lib/tile-cosmetics';

export type CosmeticUserProfile = {
  berries?: number;
  experience?: number;
  level?: number;
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
  const experience = typeof safeProfile.experience === 'number' ? safeProfile.experience : 0;
  const level = getLevelForExperience(experience);

  return {
    ...safeProfile,
    berries: typeof safeProfile.berries === 'number' ? safeProfile.berries : STARTER_BERRIES,
    experience,
    level,
    ownedTileSetIds,
    equippedTileSetId: ownedTileSetIds.includes(equippedTileSetId)
      ? equippedTileSetId
      : ownedTileSetIds[0],
  };
}
