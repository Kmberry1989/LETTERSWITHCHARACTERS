import type { RetentionState } from '@/lib/retention';

export const CLAW_TOKEN_COST = 25;
/** @deprecated Use CLAW_TOKEN_COST. Kept for older imports and saved clients. */
export const CLAW_CREDIT_COST = CLAW_TOKEN_COST;
export const CLAW_STOCK_SIZE = 12;

export type ClawPhase =
  | 'loading'
  | 'ready'
  | 'aiming'
  | 'dropping'
  | 'closing'
  | 'lifting'
  | 'delivering'
  | 'releasing'
  | 'result';

export type ClawPrizeDefinition = {
  id: string;
  name: string;
  modelUrl: string;
  previewColor: string;
  collider: [number, number, number];
  scale: number;
};

export type ClawPlay = {
  id: string;
  seed: number;
  stockPrizeIds: string[];
  clawX: number;
  clawZ: number;
  status: 'active';
  startedAt: string;
};

export type ClawStats = {
  plays: number;
  wins: number;
  misses: number;
  collectionCompletedAt?: string | null;
};

export type ClawCollection = {
  ownedPrizeIds: string[];
  prizeWonAt: Record<string, string>;
  total: number;
  complete: boolean;
};

export type ClawGameSnapshot = {
  mode: 'claw-crane';
  coordinateSystem: string;
  phase: ClawPhase;
  practice: boolean;
  tokens: number | 'unlimited';
  /** @deprecated Compatibility alias for older game harnesses. */
  credits: number | 'unlimited';
  berries: number | null;
  camera: { yaw: number; pitch: number; zoom: number; distance: number };
  carriage: { x: number; z: number; velocityX: number; velocityZ: number };
  claw: { y: number; fingerOpen: number; capturedPrizeId: string | null };
  fillerBalls: { count: number; colors: string[] };
  visiblePrizes: Array<{ id: string; x: number; y: number; z: number }>;
  lastResult: { kind: 'win' | 'miss'; prizeId?: string | null; score: number } | null;
};

export type ClawProfileFields = {
  berries?: number;
  experience?: number;
  level?: number;
  retention?: Partial<RetentionState>;
  clawTokens?: number;
  /** @deprecated Legacy saved balance migrated into clawTokens on the next write. */
  clawCredits?: number;
  ownedClawPrizeIds?: string[];
  clawPrizeWonAt?: Record<string, string>;
  clawStats?: Partial<ClawStats>;
  activeClawPlay?: ClawPlay | null;
  recentClawPlayIds?: string[];
  clawCabinetSeed?: number;
};

const PRIZE_NAMES = [
  'Blip',
  'Bop',
  'Buzzy',
  'Cacty',
  'Chirpy',
  'Chunk',
  'Frostet',
  'Gizmo',
  'Gloppy',
  'Luma',
  'Lumio',
  'Marlo',
  'Momo',
  'Mossi',
  'Nibbles',
  'Nimbus',
  'Nova',
  'Pebble',
  'Peblo',
  'Pogo',
  'Poppy',
  'Quillix',
  'Riff',
  'Rootsy',
  'Shelby',
  'Sparkie',
  'Sprinkles',
  'Sprout',
  'Tango',
  'Twix',
  'Zippy',
  'Zuzu',
] as const;

const PRIZE_COLORS = [
  '#fb7185',
  '#f59e0b',
  '#facc15',
  '#84cc16',
  '#22d3ee',
  '#a78bfa',
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#c084fc',
  '#38bdf8',
  '#fb923c',
] as const;

export const CLAW_PRIZE_CATALOG: ClawPrizeDefinition[] = PRIZE_NAMES.map((name, index) => {
  const id = name.toLowerCase();
  return {
    id,
    name,
    modelUrl: `/prizes/char-${name}.glb`,
    previewColor: PRIZE_COLORS[index % PRIZE_COLORS.length],
    collider: [0.46, 0.46, name === 'Bop' || name === 'Sprout' ? 0.16 : 0.34],
    scale: 1,
  };
});

export const CLAW_PRIZE_BY_ID = Object.fromEntries(
  CLAW_PRIZE_CATALOG.map((prize) => [prize.id, prize])
) as Record<string, ClawPrizeDefinition>;

export const DEFAULT_CLAW_STATS: ClawStats = {
  plays: 0,
  wins: 0,
  misses: 0,
  collectionCompletedAt: null,
};

function sanitizeSeed(value: unknown, fallback = 1907) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.abs(Math.floor(value)) || fallback
    : fallback;
}

export function normalizeClawProfile(profile: ClawProfileFields | null | undefined) {
  const validIds = new Set(CLAW_PRIZE_CATALOG.map((prize) => prize.id));
  const ownedClawPrizeIds = Array.from(
    new Set(
      Array.isArray(profile?.ownedClawPrizeIds)
        ? profile.ownedClawPrizeIds.filter((id): id is string => typeof id === 'string' && validIds.has(id))
        : []
    )
  );
  const prizeWonAt =
    profile?.clawPrizeWonAt && typeof profile.clawPrizeWonAt === 'object'
      ? Object.fromEntries(
          Object.entries(profile.clawPrizeWonAt).filter(
            ([id, value]) => validIds.has(id) && typeof value === 'string'
          )
        )
      : {};
  const stats = {
    ...DEFAULT_CLAW_STATS,
    ...(profile?.clawStats || {}),
  };

  return {
    clawTokens: Math.max(
      0,
      Math.floor(
        typeof profile?.clawTokens === 'number'
          ? profile.clawTokens
          : profile?.clawCredits || 0
      )
    ),
    ownedClawPrizeIds,
    clawPrizeWonAt: prizeWonAt,
    clawStats: {
      plays: Math.max(0, Math.floor(stats.plays || 0)),
      wins: Math.max(0, Math.floor(stats.wins || 0)),
      misses: Math.max(0, Math.floor(stats.misses || 0)),
      collectionCompletedAt: stats.collectionCompletedAt || null,
    } satisfies ClawStats,
    activeClawPlay:
      profile?.activeClawPlay?.status === 'active' && typeof profile.activeClawPlay.id === 'string'
        ? profile.activeClawPlay
        : null,
    recentClawPlayIds: Array.isArray(profile?.recentClawPlayIds)
      ? profile.recentClawPlayIds.filter((id): id is string => typeof id === 'string').slice(-20)
      : [],
    clawCabinetSeed: sanitizeSeed(profile?.clawCabinetSeed),
  };
}

function seededShuffle<T>(values: T[], seed: number) {
  const result = [...values];
  let state = sanitizeSeed(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectClawStock(ownedPrizeIds: string[], seed: number, size = CLAW_STOCK_SIZE) {
  const owned = new Set(ownedPrizeIds);
  const available = CLAW_PRIZE_CATALOG.filter((prize) => !owned.has(prize.id)).map((prize) => prize.id);
  return seededShuffle(available, seed).slice(0, Math.min(size, available.length));
}

export function nextClawCabinetSeed(seed: number) {
  return ((sanitizeSeed(seed) * 1103515245 + 12345) >>> 0) || 1907;
}

export function makeClawCollection(profile: ClawProfileFields | null | undefined): ClawCollection {
  const normalized = normalizeClawProfile(profile);
  return {
    ownedPrizeIds: normalized.ownedClawPrizeIds,
    prizeWonAt: normalized.clawPrizeWonAt,
    total: CLAW_PRIZE_CATALOG.length,
    complete: normalized.ownedClawPrizeIds.length >= CLAW_PRIZE_CATALOG.length,
  };
}
