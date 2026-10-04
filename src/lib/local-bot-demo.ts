import type { PlacedTile, Tile } from '@/lib/game/types';

export const LOCAL_DEMO_RACK: Tile[] = [
  { letter: 'C', score: 3 },
  { letter: 'A', score: 1 },
  { letter: 'T', score: 1 },
  { letter: 'E', score: 1 },
  { letter: 'R', score: 1 },
  { letter: 'N', score: 1 },
  { letter: 'O', score: 1 },
];

export const LOCAL_DEMO_START = { row: 7, col: 6 } as const;

export function buildDemoPendingTiles(selectedIndexes: number[]): PlacedTile[] {
  return selectedIndexes.map((rackIndex, position) => ({
    ...LOCAL_DEMO_RACK[rackIndex],
    row: LOCAL_DEMO_START.row,
    col: LOCAL_DEMO_START.col + position,
    tileSetId: 'tile-minimalist',
    ownerUid: 'local-demo-player',
  }));
}

export function getDemoWord(selectedIndexes: number[]) {
  return selectedIndexes.map((index) => LOCAL_DEMO_RACK[index]?.letter || '').join('');
}

export function isDemoOpeningMove(selectedIndexes: number[]) {
  return getDemoWord(selectedIndexes) === 'CAT';
}

export function commitDemoOpening(pendingTiles: PlacedTile[]): Record<string, Tile> {
  return Object.fromEntries(pendingTiles.map(({ row, col, ...tile }) => [`${row}-${col}`, tile]));
}

export function addDemoBotMove(board: Record<string, Tile>): Record<string, Tile> {
  return {
    ...board,
    '7-9': {
      letter: 'S',
      score: 1,
      tileSetId: 'tile-minimalist',
      ownerUid: 'bitty-botty-demo',
    },
  };
}
