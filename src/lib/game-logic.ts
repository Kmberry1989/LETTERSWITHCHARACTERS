import { Tile } from '@/components/game/game-board';
import { TILE_BAG_CONFIG } from './tile-bag';

/**
 * Creates a new, shuffled tile bag based on the game configuration.
 */
export function createTileBag(): Tile[] {
  let tileBag: Tile[] = [];
  for (const letter in TILE_BAG_CONFIG) {
    const { score, count } = TILE_BAG_CONFIG[letter as keyof typeof TILE_BAG_CONFIG];
    for (let i = 0; i < count; i++) {
      tileBag.push({ letter, score });
    }
  }

  // Shuffle the tile bag using Fisher-Yates algorithm
  for (let i = tileBag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]];
  }

  return tileBag;
}

/**
 * Draws a specified number of tiles from the tile bag.
 * @param tileBag The current tile bag.
 * @param count The number of tiles to draw.
 * @returns A tuple containing the array of drawn tiles and the updated tile bag.
 */
export function drawTiles(tileBag: Tile[], count: number): [Tile[], Tile[]] {
  const drawnTiles: Tile[] = [];
  const remainingBag = [...tileBag];
  
  for (let i = 0; i < count; i++) {
    if (remainingBag.length === 0) break;
    const tile = remainingBag.pop();
    if (tile) {
      drawnTiles.push(tile);
    }
  }

  return [drawnTiles, remainingBag];
}
