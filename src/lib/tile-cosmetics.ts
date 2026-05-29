import generatedTileCosmetics from '@/lib/generated/tile-cosmetics.generated.json';

export type TileRarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary';

export type TileCosmetic = {
  id: string;
  fileName: string;
  name: string;
  description: string;
  price: number;
  assetPath: string;
  rarity: TileRarity;
  requiredLevel: number;
};

export const STARTER_TILE_SET_ID = 'tile-minimalist';
export const STARTER_BERRIES = 1250;
export const WIN_BONUS_BERRIES = 75;
export const WIN_BONUS_EXPERIENCE = 75;
export const XP_TO_NEXT_LEVEL_BASE = 180;
export const XP_TO_NEXT_LEVEL_GROWTH = 40;
export const XP_TO_NEXT_LEVEL_ACCELERATION = 5;

export const TILE_COSMETICS = generatedTileCosmetics as TileCosmetic[];

export const TILE_COSMETICS_BY_ID = Object.fromEntries(
  TILE_COSMETICS.map((tileSet) => [tileSet.id, tileSet])
) as Record<string, TileCosmetic>;

const LEGACY_TILE_ID_ALIASES: Record<string, string> = {
  'tile-plastic': STARTER_TILE_SET_ID,
  'tile-wood': 'tile-basket-weave',
  'tile-gummy': 'tile-gummy-candy',
  'tile-runes': 'tile-ancient-runes',
  'tile-circuit': 'tile-circuit-board',
  'tile-felt': 'tile-stitched-felt',
  'tile-chrome': 'tile-polished-chrome',
  'tile-holographic': 'tile-holographic',
  'tile-lava': 'tile-cracked-lava',
  'tile-papyrus': 'tile-aged-papyrus',
  'tile-gilded': 'tile-gilded-age',
  'tile-jellyfish': 'tile-jellyfish',
  'tile-carbon': 'tile-carbon-fiber',
  'tile-minimalist': 'tile-minimalist',
};

export function resolveTileAlias(tileSetId?: string | null) {
  if (!tileSetId) return null;
  return LEGACY_TILE_ID_ALIASES[tileSetId] || tileSetId;
}

export function getTileCosmetic(tileSetId?: string | null): TileCosmetic {
  const resolvedId = resolveTileAlias(tileSetId);
  if (resolvedId && TILE_COSMETICS_BY_ID[resolvedId]) {
    return TILE_COSMETICS_BY_ID[resolvedId];
  }

  return TILE_COSMETICS_BY_ID[STARTER_TILE_SET_ID];
}

export function normalizeOwnedTileSetIds(ownedTileSetIds?: string[] | null): string[] {
  const validIds = new Set(TILE_COSMETICS.map((item) => item.id));
  const owned = Array.isArray(ownedTileSetIds)
    ? ownedTileSetIds
        .map((id) => resolveTileAlias(id))
        .filter((id): id is string => typeof id === 'string' && validIds.has(id))
    : [];
  if (!owned.includes(STARTER_TILE_SET_ID)) {
    owned.unshift(STARTER_TILE_SET_ID);
  }
  return Array.from(new Set(owned));
}

export function resolveEquippedTileSetId(tileSetId?: string | null, equippedTileSetId?: string | null) {
  const desired = resolveTileAlias(equippedTileSetId) || resolveTileAlias(tileSetId) || STARTER_TILE_SET_ID;
  return getTileCosmetic(desired).id;
}

export function getBerryRewardForScore(score: number) {
  return Math.max(1, Math.floor(score / 2));
}

export function getExperienceRequiredForNextLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const growthStep = normalizedLevel - 1;

  return (
    XP_TO_NEXT_LEVEL_BASE +
    growthStep * XP_TO_NEXT_LEVEL_GROWTH +
    growthStep * growthStep * XP_TO_NEXT_LEVEL_ACCELERATION
  );
}

export function getExperienceForLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.floor(level));

  if (normalizedLevel === 1) {
    return 0;
  }

  let totalExperience = 0;

  for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel += 1) {
    totalExperience += getExperienceRequiredForNextLevel(currentLevel);
  }

  return totalExperience;
}

export function getLevelForExperience(experience: number) {
  let level = 1;
  let remainingExperience = Math.max(0, Math.floor(experience));

  while (remainingExperience >= getExperienceRequiredForNextLevel(level)) {
    remainingExperience -= getExperienceRequiredForNextLevel(level);
    level += 1;
  }

  return level;
}

export function getExperienceProgress(experience: number) {
  const level = getLevelForExperience(experience);
  const currentLevelExperience = getExperienceForLevel(level);
  const nextLevelExperience = getExperienceForLevel(level + 1);
  const experienceIntoLevel = Math.max(0, Math.floor(experience) - currentLevelExperience);
  const experienceNeeded = Math.max(1, nextLevelExperience - currentLevelExperience);
  const progress = Math.min(1, experienceIntoLevel / experienceNeeded);

  return {
    level,
    currentLevelExperience,
    nextLevelExperience,
    experienceIntoLevel,
    experienceNeeded,
    progress,
  };
}

export function canAccessTileTier(level: number, tileSetId: string) {
  const tile = getTileCosmetic(tileSetId);
  return level >= tile.requiredLevel;
}
