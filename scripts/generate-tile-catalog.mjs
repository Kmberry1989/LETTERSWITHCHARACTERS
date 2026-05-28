import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const tilesDir = join(ROOT, 'public', 'tiles');
const outputDir = join(ROOT, 'src', 'lib', 'generated');
const outputFile = join(outputDir, 'tile-cosmetics.generated.json');

const STARTER_FILE = 'minimalist_tile.png';

const tierConfig = {
  starter: { requiredLevel: 1, basePrice: 0, step: 0 },
  common: { requiredLevel: 1, basePrice: 350, step: 70 },
  rare: { requiredLevel: 3, basePrice: 800, step: 110 },
  epic: { requiredLevel: 6, basePrice: 1450, step: 150 },
  legendary: { requiredLevel: 10, basePrice: 2300, step: 190 },
};

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
  .filter((file) => file.toLowerCase().endsWith('.png'))
  .sort((a, b) => a.localeCompare(b))
  .sort((a, b) => {
    if (a === STARTER_FILE) return -1;
    if (b === STARTER_FILE) return 1;
    return 0;
  });

const tierCounts = {
  starter: 0,
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
};

const manifest = files.map((file, index) => {
  const tier = tierForIndex(index, files.length);
  const tierMeta = tierConfig[tier];
  const tierIndex = tierCounts[tier]++;
  const filename = file.replace(/\.png$/i, '');
  const normalized = filename.replace(/_tile$/i, '');
  const id = `tile-${normalized.replace(/_/g, '-')}`;
  const name = titleCase(normalized);

  return {
    id,
    fileName: file,
    name,
    description:
      tier === 'starter'
        ? `${name} is your starter finish.`
        : `${name} tile finish with a ${tier} unlock tier.`,
    assetPath: `/tiles/${file}`,
    rarity: tier,
    requiredLevel: tierMeta.requiredLevel,
    price: tierMeta.basePrice + tierMeta.step * tierIndex,
  };
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
