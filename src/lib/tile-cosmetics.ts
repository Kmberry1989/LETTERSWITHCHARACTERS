export type TileRarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary';

export type TileCosmetic = {
  id: string;
  name: string;
  description: string;
  price: number;
  assetPath: string;
  rarity: TileRarity;
};

export const STARTER_TILE_SET_ID = 'tile-minimalist';
export const STARTER_BERRIES = 1250;
export const WIN_BONUS_BERRIES = 75;

export const TILE_COSMETICS: TileCosmetic[] = [
  {
    id: 'tile-minimalist',
    name: 'Minimalist',
    description: 'Clean, bright tiles for a timeless opening set.',
    price: 0,
    assetPath: '/tiles/minimalist_tile.png',
    rarity: 'starter',
  },
  {
    id: 'tile-wood',
    name: 'Basket Weave',
    description: 'Warm woven grain with a hand-crafted table feel.',
    price: 500,
    assetPath: '/tiles/basket_weave_tile.png',
    rarity: 'common',
  },
  {
    id: 'tile-gummy',
    name: 'Gummy Candy',
    description: 'Sugary color and soft highlights without losing legibility.',
    price: 750,
    assetPath: '/tiles/gummy_candy_tile.png',
    rarity: 'common',
  },
  {
    id: 'tile-runes',
    name: 'Ancient Runes',
    description: 'Weathered stone energy for higher-stakes words.',
    price: 1000,
    assetPath: '/tiles/ancient_runes_tile.png',
    rarity: 'rare',
  },
  {
    id: 'tile-circuit',
    name: 'Circuit Board',
    description: 'Neon traces and machine precision for tech-forward boards.',
    price: 1200,
    assetPath: '/tiles/circuit_board_tile.png',
    rarity: 'rare',
  },
  {
    id: 'tile-felt',
    name: 'Stitched Felt',
    description: 'A tactile craft-table finish with soft shadows.',
    price: 600,
    assetPath: '/tiles/stitched_felt_tile.png',
    rarity: 'common',
  },
  {
    id: 'tile-chrome',
    name: 'Polished Chrome',
    description: 'Mirror-slick metal with cool industrial contrast.',
    price: 1500,
    assetPath: '/tiles/polished_chrome_tile.png',
    rarity: 'epic',
  },
  {
    id: 'tile-holographic',
    name: 'Holographic',
    description: 'Iridescent shimmer for players who want the board to glow.',
    price: 2000,
    assetPath: '/tiles/holographic_tile.png',
    rarity: 'legendary',
  },
  {
    id: 'tile-lava',
    name: 'Cracked Lava',
    description: 'Smoldering fissures and volcanic contrast.',
    price: 1750,
    assetPath: '/tiles/cracked_lava_tile.png',
    rarity: 'epic',
  },
  {
    id: 'tile-papyrus',
    name: 'Aged Papyrus',
    description: 'Old-world fibers with quiet scholar energy.',
    price: 800,
    assetPath: '/tiles/aged_papyrus_tile.png',
    rarity: 'common',
  },
  {
    id: 'tile-gilded',
    name: 'Gilded Age',
    description: 'Ornate shine for players who want every bingo to feel expensive.',
    price: 2500,
    assetPath: '/tiles/gilded_age_tile.png',
    rarity: 'legendary',
  },
  {
    id: 'tile-jellyfish',
    name: 'Jellyfish',
    description: 'Deep-sea glow with dreamy cyan highlights.',
    price: 1800,
    assetPath: '/tiles/jellyfish_tile.png',
    rarity: 'epic',
  },
  {
    id: 'tile-carbon',
    name: 'Carbon Fiber',
    description: 'High-performance texture with dark woven depth.',
    price: 2200,
    assetPath: '/tiles/carbon_fiber_tile.png',
    rarity: 'legendary',
  },
];

export const TILE_COSMETICS_BY_ID = Object.fromEntries(
  TILE_COSMETICS.map((tileSet) => [tileSet.id, tileSet])
) as Record<string, TileCosmetic>;

export function getTileCosmetic(tileSetId?: string | null): TileCosmetic {
  if (tileSetId && TILE_COSMETICS_BY_ID[tileSetId]) {
    return TILE_COSMETICS_BY_ID[tileSetId];
  }

  return TILE_COSMETICS_BY_ID[STARTER_TILE_SET_ID];
}

export function normalizeOwnedTileSetIds(ownedTileSetIds?: string[] | null): string[] {
  const validIds = new Set(TILE_COSMETICS.map((item) => item.id));
  const owned = Array.isArray(ownedTileSetIds) ? ownedTileSetIds.filter((id) => validIds.has(id)) : [];
  if (!owned.includes(STARTER_TILE_SET_ID)) {
    owned.unshift(STARTER_TILE_SET_ID);
  }
  return Array.from(new Set(owned));
}

export function resolveEquippedTileSetId(tileSetId?: string | null, equippedTileSetId?: string | null) {
  const desired = equippedTileSetId || tileSetId || STARTER_TILE_SET_ID;
  return getTileCosmetic(desired).id;
}

export function getBerryRewardForScore(score: number) {
  return Math.max(1, Math.floor(score / 2));
}
