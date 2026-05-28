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
export const EXPERIENCE_PER_LEVEL = 150;

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

export function getLevelForExperience(experience: number) {
  return Math.max(1, Math.floor(Math.max(0, experience) / EXPERIENCE_PER_LEVEL) + 1);
}

export function canAccessTileTier(level: number, tileSetId: string) {
  const tile = getTileCosmetic(tileSetId);
  return level >= tile.requiredLevel;
}
