export type WordSearchPlacement = {
  word: string;
  startRow: number;
  startCol: number;
  rowStep: number;
  colStep: number;
  cells: Array<{ row: number; col: number }>;
};

export type WordSearchPuzzle = {
  grid: string[][];
  words: string[];
  placements: WordSearchPlacement[];
  size: number;
};

export type WordConnectPuzzle = {
  letters: string[];
  acceptedWords: string[];
  targetCount: number;
};

type Direction = { rowStep: number; colStep: number };
type WordConnectSource = {
  anchor: string;
  acceptedWords: string[];
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WORD_SEARCH_SIZE = 8;
const WORD_SEARCH_COUNT = 5;
const WORD_CONNECT_TARGET_COUNT = 4;
const WORD_SEARCH_DIRECTIONS: Direction[] = [
  { rowStep: 0, colStep: 1 },
  { rowStep: 1, colStep: 0 },
  { rowStep: 1, colStep: 1 },
];

const EASY_WORD_SEARCH_WORDS = [
  'apple',
  'beach',
  'bread',
  'chair',
  'cloud',
  'dance',
  'fruit',
  'green',
  'happy',
  'house',
  'light',
  'music',
  'ocean',
  'panda',
  'pizza',
  'plant',
  'river',
  'smile',
  'snack',
  'sunny',
  'tiger',
  'toast',
  'train',
  'water',
  'whale',
  'zebra',
] as const;

const WORD_CONNECT_PUZZLES: WordConnectSource[] = [
  { anchor: 'stone', acceptedWords: ['one', 'tone', 'note', 'nose', 'ones', 'stone'] },
  { anchor: 'trail', acceptedWords: ['air', 'tail', 'rail', 'liar', 'trial', 'trail'] },
  { anchor: 'smile', acceptedWords: ['lie', 'lime', 'mile', 'isle', 'slime', 'smile'] },
  { anchor: 'cares', acceptedWords: ['care', 'race', 'scar', 'cars', 'acres', 'cares'] },
  { anchor: 'plane', acceptedWords: ['ape', 'lean', 'lane', 'pane', 'plane', 'peal'] },
  { anchor: 'planet', acceptedWords: ['ant', 'net', 'lane', 'leap', 'panel', 'planet'] },
] as const;

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  rowStep: number,
  colStep: number,
) {
  const cells: Array<{ row: number; col: number }> = [];

  for (let index = 0; index < word.length; index += 1) {
    const row = startRow + rowStep * index;
    const col = startCol + colStep * index;
    if (row < 0 || col < 0 || row >= grid.length || col >= grid.length) {
      return null;
    }
    const existing = grid[row][col];
    if (existing && existing !== word[index]) {
      return null;
    }
    cells.push({ row, col });
  }

  return cells;
}

export function generateWordSearchPuzzle(size = WORD_SEARCH_SIZE, wordCount = WORD_SEARCH_COUNT): WordSearchPuzzle {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
    const selectedWords = shuffle(EASY_WORD_SEARCH_WORDS)
      .slice(0, wordCount)
      .sort((left, right) => right.length - left.length);
    const placements: WordSearchPlacement[] = [];
    let failed = false;

    for (const word of selectedWords) {
      let placed = false;
      const directions = shuffle(WORD_SEARCH_DIRECTIONS);

      for (const direction of directions) {
        const maxRow = direction.rowStep === 1 ? size - word.length : size - 1;
        const maxCol = direction.colStep === 1 ? size - word.length : size - 1;
        const rows = shuffle(Array.from({ length: maxRow + 1 }, (_, index) => index));
        const cols = shuffle(Array.from({ length: maxCol + 1 }, (_, index) => index));

        for (const row of rows) {
          for (const col of cols) {
            const cells = canPlaceWord(grid, word, row, col, direction.rowStep, direction.colStep);
            if (!cells) continue;

            cells.forEach(({ row: cellRow, col: cellCol }, index) => {
              grid[cellRow][cellCol] = word[index].toUpperCase();
            });
            placements.push({
              word: word.toUpperCase(),
              startRow: row,
              startCol: col,
              rowStep: direction.rowStep,
              colStep: direction.colStep,
              cells,
            });
            placed = true;
            break;
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (failed) continue;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        }
      }
    }

    return {
      grid,
      words: placements.map((placement) => placement.word),
      placements,
      size,
    };
  }

  throw new Error('Unable to generate a word search puzzle.');
}

export function generateWordConnectPuzzle(): WordConnectPuzzle {
  const easyAnchors = WORD_CONNECT_PUZZLES.filter((item) => item.anchor.length === 5);
  const pool = easyAnchors.length > 0 ? easyAnchors : WORD_CONNECT_PUZZLES;
  const selected = randomItem(pool);

  return {
    letters: shuffle(selected.anchor.toUpperCase().split('')),
    acceptedWords: selected.acceptedWords.map((word) => word.toUpperCase()),
    targetCount: WORD_CONNECT_TARGET_COUNT,
  };
}
