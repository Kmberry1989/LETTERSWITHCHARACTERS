import { describe, expect, it } from 'vitest';
import { addDemoBotMove, buildDemoPendingTiles, commitDemoOpening, getDemoWord, isDemoOpeningMove } from '@/lib/local-bot-demo';
import { getTileCosmetic, TILE_COSMETICS } from '@/lib/tile-cosmetics';

describe('single-player bot match', () => {
  it('builds the guided CAT opening across the center star', () => {
    const selection = [0, 1, 2];
    const pending = buildDemoPendingTiles(selection);
    expect(getDemoWord(selection)).toBe('CAT');
    expect(isDemoOpeningMove(selection)).toBe(true);
    expect(pending.map(({ row, col, letter }) => ({ row, col, letter }))).toEqual([
      { row: 7, col: 6, letter: 'C' },
      { row: 7, col: 7, letter: 'A' },
      { row: 7, col: 8, letter: 'T' },
    ]);
  });

  it('rejects another rack order and adds the deterministic bot S locally', () => {
    expect(isDemoOpeningMove([1, 0, 2])).toBe(false);
    const board = commitDemoOpening(buildDemoPendingTiles([0, 1, 2]));
    expect(addDemoBotMove(board)['7-9']).toMatchObject({ letter: 'S', ownerUid: 'bitty-botty-demo' });
  });
});

describe('new storybook tile customization', () => {
  it('publishes each new tile with its authored collection and readable text tone', () => {
    const expected = {
      'tile-moonlit-observatory': 'light',
      'tile-strawberry-picnic': 'dark',
      'tile-enchanted-moss': 'light',
      'tile-dragon-scale': 'light',
    } as const;

    for (const [id, readabilityTone] of Object.entries(expected)) {
      expect(TILE_COSMETICS.some((tile) => tile.id === id)).toBe(true);
      expect(getTileCosmetic(id)).toMatchObject({ collection: 'Storybook Treasures', readabilityTone });
    }
  });
});
