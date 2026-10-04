import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const tilesDir = join(ROOT, 'public', 'tiles');
const outputDir = join(ROOT, 'src', 'lib', 'generated');
const outputFile = join(outputDir, 'tile-cosmetics.generated.json');
const collectionDefinitionsFile = join(ROOT, 'scripts', 'tile-collection-definitions.json');

const STARTER_FILE = 'minimalist_tile.png';
const collectionDefinitions = JSON.parse(readFileSync(collectionDefinitionsFile, 'utf8'));

const collectionTileByFile = new Map();
for (const collection of collectionDefinitions) {
  for (const tile of collection.tiles) {
    if (collectionTileByFile.has(tile.fileName)) {
      throw new Error(`Duplicate collection tile definition for ${tile.fileName}`);
    }
    collectionTileByFile.set(tile.fileName, {
      ...tile,
      collection: collection.name,
      description: collection.descriptionTemplate.replace('{name}', tile.name),
    });
  }
}

// Published tile prices and unlock levels are part of the player economy. Keep
// existing entries stable when new artwork is added, while allowing every new
// tile to receive a deliberately authored progression slot.
const NEW_TILE_CHARACTERISTICS = {
  'aquatic_tile.png': {
    name: 'Aquatic',
    description: 'A luminous underwater finish rippled with cool teal currents.',
    rarity: 'rare',
    requiredLevel: 7,
    price: 900,
  },
  'blue_and_white_tile.png': {
    name: 'Porcelain Bloom',
    description: 'A crisp blue floral motif painted across weathered porcelain.',
    rarity: 'common',
    requiredLevel: 2,
    price: 400,
  },
  'cartography_tile.png': {
    name: "Cartographer's Compass",
    description: 'An aged explorer map centered on a hand-drawn compass rose.',
    rarity: 'rare',
    requiredLevel: 7,
    price: 980,
  },
  'cavernous_tile.png': {
    name: 'Sapphire Cavern',
    description: 'Deep blue crystal facets catching light inside a hidden cavern.',
    rarity: 'epic',
    requiredLevel: 11,
    price: 1550,
  },
  'chilled_field_tile.png': {
    name: 'Chilled Field',
    description: 'Delicate winter fronds suspended beneath pale blue frost.',
    rarity: 'common',
    requiredLevel: 3,
    price: 540,
  },
  'copper_plate_tile.png': {
    name: 'Copper Plate',
    description: 'A warm brushed-copper plate secured with sturdy corner rivets.',
    rarity: 'rare',
    requiredLevel: 8,
    price: 1120,
  },
  'crated_tile.png': {
    name: 'Ironbound Crate',
    description: 'Dark timber reinforced with rugged iron straps and corner plates.',
    rarity: 'common',
    requiredLevel: 5,
    price: 820,
  },
  'crevice_tile.png': {
    name: 'Mossy Crevice',
    description: 'Ancient fitted stones with bright moss growing through the cracks.',
    rarity: 'rare',
    requiredLevel: 8,
    price: 1240,
  },
  'deserted_tile.png': {
    name: 'Desert Dunes',
    description: 'Sunlit golden sand shaped into soft windswept ridges.',
    rarity: 'common',
    requiredLevel: 4,
    price: 680,
  },
  'floral_green_tile.png': {
    name: 'Secret Garden',
    description: 'A lush wreath of ivy and small white woodland blossoms.',
    rarity: 'epic',
    requiredLevel: 11,
    price: 1650,
  },
  'galactic_swirl_tile.png': {
    name: 'Galactic Swirl',
    description: 'A brilliant spiral galaxy turning through a field of distant stars.',
    rarity: 'legendary',
    requiredLevel: 20,
    price: 3250,
  },
  'geologic_tile.png': {
    name: 'Geologic Frost',
    description: 'Pale mineral layers broken over a bed of dark glacial stone.',
    rarity: 'rare',
    requiredLevel: 9,
    price: 1460,
  },
  'glassy_tile.png': {
    name: 'Prismatic Glass',
    description: 'Jewel-bright panes joined into a bold stained-glass mosaic.',
    rarity: 'epic',
    requiredLevel: 12,
    price: 1800,
  },
  'green_gold_tile.png': {
    name: 'Gilded Jade',
    description: 'Polished green stone repaired with fine branching seams of gold.',
    rarity: 'epic',
    requiredLevel: 12,
    price: 1920,
  },
  'leather_bound_tile.png': {
    name: 'Leather Bound',
    description: 'Rich brown leather finished with a neatly stitched inset border.',
    rarity: 'rare',
    requiredLevel: 9,
    price: 1580,
  },
  'lilac_tile.png': {
    name: 'Lilac Press',
    description: 'Pressed lavender sprigs arranged on softly textured handmade paper.',
    rarity: 'common',
    requiredLevel: 3,
    price: 470,
  },
  'magma_tile.png': {
    name: 'Magma Core',
    description: 'Black volcanic stone split by a fierce molten-orange glow.',
    rarity: 'legendary',
    requiredLevel: 18,
    price: 2880,
  },
  'part_voronoi_tile.png': {
    name: 'Alloy Hive',
    description: 'A dark industrial alloy panel built around a reinforced honeycomb vent.',
    rarity: 'legendary',
    requiredLevel: 17,
    price: 2700,
  },
  'pearl_tile.png': {
    name: 'Pearl Sheen',
    description: 'Soft pearlescent waves flashing with delicate opal color.',
    rarity: 'rare',
    requiredLevel: 10,
    price: 1760,
  },
  'purple_swirl_tile.png': {
    name: 'Violet Vortex',
    description: 'A luminous violet current spiraling into a deep cosmic center.',
    rarity: 'legendary',
    requiredLevel: 15,
    price: 2350,
  },
  'red_tuft_tile.png': {
    name: 'Royal Tuft',
    description: 'Plush crimson upholstery buttoned in gold and framed like a throne.',
    rarity: 'epic',
    requiredLevel: 13,
    price: 2100,
  },
  'runic_tile.png': {
    name: 'Runic Stone',
    description: 'A weathered black stone carved with an enigmatic spiral sigil.',
    rarity: 'legendary',
    requiredLevel: 16,
    price: 2520,
  },
  'sandy_greenery_tile.png': {
    name: 'Sandstone Garden',
    description: 'An ornate floral relief carved into pale, warm sandstone.',
    rarity: 'common',
    requiredLevel: 6,
    price: 960,
  },
  'sandy_rune_tile.png': {
    name: 'Sand Rune',
    description: 'A timeworn desert tablet marked by a deep spiral rune.',
    rarity: 'rare',
    requiredLevel: 10,
    price: 1880,
  },
  'sun_sand_tile.png': {
    name: 'Sun Relic',
    description: 'A radiant golden sun medallion set into an ornate desert relic.',
    rarity: 'epic',
    requiredLevel: 14,
    price: 2400,
  },
};

const tierConfig = {
  starter: { minLevel: 1, maxLevel: 1, basePrice: 0, step: 0 },
  common: { minLevel: 2, maxLevel: 6, basePrice: 350, step: 70 },
  rare: { minLevel: 7, maxLevel: 10, basePrice: 800, step: 110 },
  epic: { minLevel: 11, maxLevel: 14, basePrice: 1450, step: 150 },
  legendary: { minLevel: 15, maxLevel: 20, basePrice: 2300, step: 190 },
};

const collectionTierConfig = [
  { lastIndex: 8, firstIndex: 0, rarity: 'common', minLevel: 2, maxLevel: 6, basePrice: 400, priceStep: 80 },
  { lastIndex: 16, firstIndex: 9, rarity: 'rare', minLevel: 7, maxLevel: 10, basePrice: 900, priceStep: 150 },
  { lastIndex: 21, firstIndex: 17, rarity: 'epic', minLevel: 11, maxLevel: 14, basePrice: 1600, priceStep: 200 },
  { lastIndex: 24, firstIndex: 22, rarity: 'legendary', minLevel: 16, maxLevel: 20, basePrice: 2500, priceStep: 300 },
];

function getCollectionProgression(order) {
  const tier = collectionTierConfig.find((item) => order <= item.lastIndex);
  if (!tier) {
    throw new Error(`Collection tile order ${order} is outside the supported 0-24 range`);
  }

  const indexWithinTier = order - tier.firstIndex;
  const countWithinTier = tier.lastIndex - tier.firstIndex + 1;
  const ratio = countWithinTier <= 1 ? 0 : indexWithinTier / (countWithinTier - 1);

  return {
    rarity: tier.rarity,
    requiredLevel: Math.round(tier.minLevel + ratio * (tier.maxLevel - tier.minLevel)),
    price: tier.basePrice + tier.priceStep * indexWithinTier,
  };
}

function titleCase(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function tierForIndex(index, total) {
  if (index === 0) return 'starter';
  const ratio = total <= 1 ? 1 : (index - 1) / Math.max(total - 1, 1);
  if (ratio < 0.35) return 'common';
  if (ratio < 0.68) return 'rare';
  if (ratio < 0.88) return 'epic';
  return 'legendary';
}

const files = readdirSync(tilesDir)
  .filter((file) => file.toLowerCase().endsWith('_tile.png'))
  .sort((a, b) => a.localeCompare(b))
  .sort((a, b) => {
    if (a === STARTER_FILE) return -1;
    if (b === STARTER_FILE) return 1;
    return 0;
  });

const publishedManifest = existsSync(outputFile)
  ? JSON.parse(readFileSync(outputFile, 'utf8'))
  : [];
const publishedByFile = new Map(publishedManifest.map((tile) => [tile.fileName, tile]));

const tierCounts = {
  starter: 0,
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
};

const classifiedFiles = files.map((file, index) => ({
  file,
  tier: tierForIndex(index, files.length),
}));

for (const item of classifiedFiles) {
  tierCounts[item.tier] += 1;
}

const tierIndices = {
  starter: 0,
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
};

function getRequiredLevel(tier, tierIndex, tierCount) {
  const tierMeta = tierConfig[tier];

  if (tier === 'starter') {
    return tierMeta.minLevel;
  }

  if (tierCount <= 1) {
    return tierMeta.minLevel;
  }

  const ratio = tierIndex / Math.max(tierCount - 1, 1);
  return Math.round(tierMeta.minLevel + ratio * (tierMeta.maxLevel - tierMeta.minLevel));
}

const manifest = classifiedFiles.map(({ file, tier }) => {
  const tierMeta = tierConfig[tier];
  const tierIndex = tierIndices[tier]++;
  const filename = file.replace(/\.png$/i, '');
  const normalized = filename.replace(/_tile$/i, '');
  const id = `tile-${normalized.replace(/_/g, '-')}`;
  const defaultName = titleCase(normalized);
  const published = publishedByFile.get(file);
  const authored = NEW_TILE_CHARACTERISTICS[file];
  const collectionTile = collectionTileByFile.get(file);
  const characteristics = collectionTile
    ? {
        ...collectionTile,
        ...getCollectionProgression(collectionTile.order),
      }
    : authored || published || {
        name: defaultName,
        description:
          tier === 'starter'
            ? `${defaultName} is your starter finish.`
            : `${defaultName} tile finish with a ${tier} unlock tier.`,
        rarity: tier,
        requiredLevel: getRequiredLevel(tier, tierIndex, tierCounts[tier]),
        price: tierMeta.basePrice + tierMeta.step * tierIndex,
      };
  const collection = characteristics.collection || (authored ? 'Signature Collection' : 'Classic Collection');

  return {
    id,
    fileName: file,
    name: characteristics.name,
    description: characteristics.description,
    assetPath: `/tiles/${file}`,
    rarity: characteristics.rarity,
    requiredLevel: characteristics.requiredLevel,
    price: characteristics.price,
    collection,
    ...(characteristics.readabilityTone ? { readabilityTone: characteristics.readabilityTone } : {}),
  };
});

for (const file of collectionTileByFile.keys()) {
  if (!files.includes(file)) {
    throw new Error(`Collection tile asset is missing: public/tiles/${file}`);
  }
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
