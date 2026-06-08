import { getPlayableWordList } from '@/lib/server/word-validator';

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

type CuratedLists = {
  wordSearch: string[];
  wordConnectWords: string[];
  wordConnectAnchors: string[];
};

let cachedCuratedLists: CuratedLists | null = null;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const DIRECTIONS = [
  { rowStep: -1, colStep: -1 },
  { rowStep: -1, colStep: 0 },
  { rowStep: -1, colStep: 1 },
  { rowStep: 0, colStep: -1 },
  { rowStep: 0, colStep: 1 },
  { rowStep: 1, colStep: -1 },
  { rowStep: 1, colStep: 0 },
  { rowStep: 1, colStep: 1 },
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function countVowels(word: string) {
  return Array.from(word).filter((letter) => VOWELS.has(letter)).length;
}

function hasRuns(word: string) {
  return /(.)\1\1/.test(word);
}

function isCuratedWord(word: string) {
  if (!/^[a-z]+$/.test(word)) return false;
  if (word.length < 3 || word.length > 8) return false;
  if (hasRuns(word)) return false;
  const vowels = countVowels(word);
  if (vowels < 1) return false;
  if (word.length >= 5 && vowels < 2) return false;
  return true;
}

function isWordSearchWord(word: string) {
  return isCuratedWord(word) && word.length >= 4 && word.length <= 8;
}

function hasUniqueLetters(word: string) {
  return new Set(word).size === word.length;
}

function getCuratedLists() {
  if (cachedCuratedLists) {
    return cachedCuratedLists;
  }

  const allWords = getPlayableWordList();
  const curated = allWords.filter(isCuratedWord);
  const wordSearch = curated.filter(isWordSearchWord);
  const wordConnectWords = curated.filter((word) => word.length >= 3 && word.length <= 6);
  const wordConnectAnchors = curated.filter(
    (word) => word.length === 6 && hasUniqueLetters(word) && countVowels(word) >= 2
  );

  cachedCuratedLists = {
    wordSearch,
    wordConnectWords,
    wordConnectAnchors,
  };

  return cachedCuratedLists;
}

function canPlaceWord(grid: string[][], word: string, startRow: number, startCol: number, rowStep: number, colStep: number) {
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

export function generateWordSearchPuzzle(size = 10, wordCount = 6): WordSearchPuzzle {
  const { wordSearch } = getCuratedLists();

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
    const selectedWords = shuffle(wordSearch)
      .filter((word, index, list) => list.indexOf(word) === index)
      .slice(0, wordCount)
      .sort((left, right) => right.length - left.length);
    const placements: WordSearchPlacement[] = [];
    let failed = false;

    for (const word of selectedWords) {
      let placed = false;
      const directions = shuffle(DIRECTIONS);
      for (const direction of directions) {
        const maxRow = direction.rowStep === 1 ? size - word.length : size - 1;
        const minRow = direction.rowStep === -1 ? word.length - 1 : 0;
        const maxCol = direction.colStep === 1 ? size - word.length : size - 1;
        const minCol = direction.colStep === -1 ? word.length - 1 : 0;
        const rows = shuffle(Array.from({ length: maxRow - minRow + 1 }, (_, index) => minRow + index));
        const cols = shuffle(Array.from({ length: maxCol - minCol + 1 }, (_, index) => minCol + index));

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

    if (failed) {
      continue;
    }

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

function getEligibleConnectWords(letterSet: Set<string>, sourceWords: string[]) {
  return sourceWords.filter((word) => {
    const chars = new Set(word);
    return chars.size === word.length && Array.from(chars).every((char) => letterSet.has(char));
  });
}

export function generateWordConnectPuzzle(): WordConnectPuzzle {
  const { wordConnectAnchors, wordConnectWords } = getCuratedLists();
  const anchors = shuffle(wordConnectAnchors);

  for (const anchor of anchors) {
    const letterSet = new Set(anchor);
    const acceptedWords = getEligibleConnectWords(letterSet, wordConnectWords)
      .filter((word) => word.length >= 3)
      .sort((left, right) => right.length - left.length);

    if (acceptedWords.length >= 8) {
      return {
        letters: shuffle(anchor.toUpperCase().split('')),
        acceptedWords: acceptedWords.slice(0, 18).map((word) => word.toUpperCase()),
        targetCount: 5,
      };
    }
  }

  const fallbackAnchor = randomItem(wordConnectAnchors);
  return {
    letters: shuffle(fallbackAnchor.toUpperCase().split('')),
    acceptedWords: [fallbackAnchor.toUpperCase()],
    targetCount: 1,
  };
}
