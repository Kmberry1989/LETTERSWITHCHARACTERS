import { PlacedTile, Tile, boardLayout } from '@/components/game/game-board';

type WordDirection = 'horizontal' | 'vertical';

interface FoundWord {
  word: string;
  tiles: PlacedTile[];
}

/**
 * Calculates the score for a move, including bonus squares.
 * @param placedTiles The tiles that were just placed in the move.
 * @param board The current state of the board before this move.
 * @returns The total score for the move.
 */
export function calculateScore(placedTiles: PlacedTile[], board: Record<string, Tile>): number {
  if (placedTiles.length === 0) return 0;

  const words = getWordsFromPlacedTiles(placedTiles, board);
  let totalScore = 0;

  words.forEach(wordInfo => {
    let wordScore = 0;
    let wordMultiplier = 1;

    wordInfo.tiles.forEach(tile => {
      const { row, col, score, isBlank } = tile;
      const bonus = boardLayout[row][col];
      const isNewTile = placedTiles.some(pt => pt.row === row && pt.col === col);
      let letterScore = isBlank ? 0 : score;
      
      if (isNewTile) {
        switch (bonus) {
          case 'DL':
            letterScore *= 2;
            break;
          case 'TL':
            letterScore *= 3;
            break;
          case 'DW':
          case '★': // Start is often a Double Word score
            wordMultiplier *= 2;
            break;
          case 'TW':
            wordMultiplier *= 3;
            break;
        }
      }
      wordScore += letterScore;
    });

    totalScore += wordScore * wordMultiplier;
  });

  // Bingo bonus for using all 7 tiles
  if (placedTiles.length === 7) {
    totalScore += 50;
  }

  return totalScore;
}


/**
 * Finds all words formed by a new tile placement.
 * @param placedTiles The newly placed tiles.
 * @param board The existing board state.
 * @returns An array of FoundWord objects.
 */
export function getWordsFromPlacedTiles(placedTiles: PlacedTile[], board: Record<string, Tile>): FoundWord[] {
  if (placedTiles.length === 0) return [];
  
  const words: FoundWord[] = [];
  const checkedTilesForWord = new Set<string>(); // "row-col"

  // Determine orientation of the main word
  let direction: WordDirection = 'horizontal';
  if (placedTiles.length > 1) {
    const allSameRow = placedTiles.every(t => t.row === placedTiles[0].row);
    const allSameCol = placedTiles.every(t => t.col === placedTiles[0].col);
    if (allSameRow) {
      direction = 'horizontal';
    } else if (allSameCol) {
      direction = 'vertical';
    } else {
        // Invalid placement if not in a line
        return [];
    }
  } else if (placedTiles.length === 1) {
    const { row, col } = placedTiles[0];
    // If there's a tile horizontally adjacent, we might form a vertical word and vice-versa
    const hasHorizontalNeighbor = board[`${row}-${col-1}`] || board[`${row}-${col+1}`];
    const hasVerticalNeighbor = board[`${row-1}-${col}`] || board[`${row+1}-${col}`];
    
    // Default to checking horizontal first if neighbors exist in both directions
    if (hasHorizontalNeighbor) {
      direction = 'horizontal';
    } else if (hasVerticalNeighbor) {
      direction = 'vertical';
    }
    // If no neighbors, direction doesn't matter yet, we will check both.
  }

  // Find the main word
  const mainWord = findWordForTile(placedTiles[0], direction, board, placedTiles);
  if (mainWord) {
    words.push(mainWord);
    mainWord.tiles.forEach(t => checkedTilesForWord.add(`${t.row}-${t.col}`));
  }

  // Find perpendicular words
  const perpDirection: WordDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
  placedTiles.forEach(tile => {
    // Check if this tile has already been part of a found word (like the main one)
    // to avoid re-evaluating single-letter cross words.
    // Instead, we just check if it forms a new multi-letter word.
    const perpWord = findWordForTile(tile, perpDirection, board, placedTiles);
    if (perpWord && perpWord.tiles.length > 1) {
        // Check if this is a new word we haven't found yet
        const isNewWord = !words.some(w => w.word === perpWord.word);
        if(isNewWord) {
           words.push(perpWord);
        }
    }
  });
  
  // Special case for single tile placement with no neighbors initially considered
  if(placedTiles.length === 1 && words.length === 0){
     const horizontalWord = findWordForTile(placedTiles[0], 'horizontal', board, placedTiles);
     if(horizontalWord && horizontalWord.tiles.length > 1) words.push(horizontalWord);
     const verticalWord = findWordForTile(placedTiles[0], 'vertical', board, placedTiles);
     if(verticalWord && verticalWord.tiles.length > 1) words.push(verticalWord);
  }


  return words.filter(w => w.word.length > 1);
}

/**
 * Helper function to find a single word that a tile belongs to in a given direction.
 */
function findWordForTile(
  tile: PlacedTile,
  direction: WordDirection,
  board: Record<string, Tile>,
  placedTiles: PlacedTile[]
): FoundWord | null {
  const allTilesOnBoard = { ...board };
  placedTiles.forEach(t => { allTilesOnBoard[`${t.row}-${t.col}`] = t; });

  let wordTiles: PlacedTile[] = [tile];
  let currentPos: number;

  // Search backward
  currentPos = direction === 'horizontal' ? tile.col - 1 : tile.row - 1;
  while (currentPos >= 0) {
    const key = direction === 'horizontal' ? `${tile.row}-${currentPos}` : `${currentPos}-${tile.col}`;
    const boardTile = allTilesOnBoard[key];
    if (boardTile) {
      wordTiles.unshift({ ...boardTile, row: direction === 'vertical' ? currentPos: tile.row, col: direction === 'horizontal' ? currentPos: tile.col });
      currentPos--;
    } else {
      break;
    }
  }

  // Search forward
  currentPos = direction === 'horizontal' ? tile.col + 1 : tile.row + 1;
  while (currentPos < 15) { // Board size
    const key = direction === 'horizontal' ? `${tile.row}-${currentPos}` : `${currentPos}-${tile.col}`;
    const boardTile = allTilesOnBoard[key];
    if (boardTile) {
      wordTiles.push({ ...boardTile, row: direction === 'vertical' ? currentPos: tile.row, col: direction === 'horizontal' ? currentPos: tile.col });
      currentPos++;
    } else {
      break;
    }
  }

  if (wordTiles.length > 1) {
    return {
      word: wordTiles.map(t => t.letter).join(''),
      tiles: wordTiles,
    };
  }

  return null;
}
