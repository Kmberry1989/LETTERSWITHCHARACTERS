import { describe, expect, it } from 'vitest';
import { CLAW_PRIZE_CATALOG, makeClawCollection, normalizeClawProfile, selectClawStock } from '@/lib/claw-crane';

describe('claw crane economy and collection', () => {
  it('migrates legacy credits and removes duplicate/unknown prizes', () => {
    const profile = normalizeClawProfile({ clawCredits: 3, ownedClawPrizeIds: ['pebble', 'pebble', 'unknown'] });
    expect(profile.clawTokens).toBe(3);
    expect(profile.ownedClawPrizeIds).toEqual(['pebble']);
  });

  it('stocks only unowned prizes deterministically', () => {
    const stockA = selectClawStock(['pebble'], 1907, 12);
    const stockB = selectClawStock(['pebble'], 1907, 12);
    expect(stockA).toEqual(stockB);
    expect(stockA).not.toContain('pebble');
    expect(new Set(stockA).size).toBe(stockA.length);
  });

  it('marks the full catalog complete only after every prize is owned', () => {
    const ids = CLAW_PRIZE_CATALOG.map((prize) => prize.id);
    expect(makeClawCollection({ ownedClawPrizeIds: ids }).complete).toBe(true);
    expect(makeClawCollection({ ownedClawPrizeIds: ids.slice(0, -1) }).complete).toBe(false);
  });
});
