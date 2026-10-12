import { BOARD_LAYOUT } from '@/lib/game/constants';
import { getPlayableWordList } from '@/lib/server/word-validator';

export type BotMove = {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical';
};

type BoardCell = { letter: string } | null;
type Board = Record<string, BoardCell>;

/**
 * Local bot that plays without AI. Uses the bundled dictionary to find
 * valid words from its tiles and places them on the board.
 * Difficulty affects word choice, not capability.
 */
export function generateLocalBotMove(
  tiles: string[],
  board: Board,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): BotMove | null {
  const wordList = getPlayableWordList();
  const tileLetters = tiles.map((t) => t.toLowerCase()).filter((t) => t && t !== ' ');
  const blanks = tiles.filter((t) => t === ' ').length;
  if (tileLetters.length === 0 && blanks === 0) return null;

  const boardEmpty = Object.keys(board).length === 0;

  // Build a set of playable words from our tiles (length 2-7, or up to tiles+1 for hooks)
  const candidates = findPlayableWords(wordList, tileLetters, blanks);

  if (candidates.length === 0) return null;

  if (boardEmpty) {
    // First move: play across the center star (7,7)
    const word = pickByDifficulty(candidates, difficulty);
    const startCol = 7 - Math.floor(word.length / 2);
    return { word: word.toUpperCase(), startRow: 7, startCol, direction: 'horizontal' };
  }

  // Find placements that connect to existing tiles
  const placements: { move: BotMove; score: number }[] = [];

  for (const word of candidates) {
    // Try every board position as a potential anchor
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Try horizontal
        const h = tryPlace(word, r, c, 'horizontal', board, tileLetters, blanks);
        if (h) placements.push(h);
        // Try vertical
        const v = tryPlace(word, r, c, 'vertical', board, tileLetters, blanks);
        if (v) placements.push(v);
      }
    }
    // Limit search for performance — 2000 placements is plenty
    if (placements.length > 2000) break;
  }

  if (placements.length === 0) return null;

  // Sort by score, pick by difficulty
  placements.sort((a, b) => b.score - a.score);
  if (difficulty === 'Hard') return placements[0].move;
  if (difficulty === 'Easy') {
    // Pick from the bottom third (weaker plays)
    const idx = Math.floor(placements.length * (0.66 + Math.random() * 0.33));
    return placements[Math.min(idx, placements.length - 1)].move;
  }
  // Medium: pick from top half randomly
  const idx = Math.floor(Math.random() * Math.min(placements.length, Math.ceil(placements.length / 2)));
  return placements[idx].move;
}

function findPlayableWords(wordList: string[], tiles: string[], blanks: number): string[] {
  const tileCounts = new Map<string, number>();
  for (const t of tiles) tileCounts.set(t, (tileCounts.get(t) || 0) + 1);

  const result: string[] = [];
  for (const word of wordList) {
    if (word.length < 2 || word.length > 8) continue;
    if (canForm(word, tileCounts, blanks)) {
      result.push(word);
      if (result.length > 500) break; // cap for performance
    }
  }
  return result;
}

function canForm(word: string, tileCounts: Map<string, number>, blanks: number): boolean {
  const needed = new Map<string, number>();
  for (const ch of word) needed.set(ch, (needed.get(ch) || 0) + 1);

  let blanksUsed = 0;
  for (const [ch, count] of needed) {
    const have = tileCounts.get(ch) || 0;
    if (have < count) {
      blanksUsed += count - have;
      if (blanksUsed > blanks) return false;
    }
  }
  return true;
}

function pickByDifficulty(candidates: string[], difficulty: string): string {
  const sorted = [...candidates].sort((a, b) => b.length - a.length);
  if (difficulty === 'Hard') return sorted[0];
  if (difficulty === 'Easy') return sorted[Math.floor(sorted.length * 0.7)] || sorted[sorted.length - 1];
  return sorted[Math.floor(Math.random() * Math.min(10, sorted.length))];
}

function tryPlace(
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  board: Board,
  tiles: string[],
  blanks: number
): { move: BotMove; score: number } | null {
  const dr = direction === 'vertical' ? 1 : 0;
  const dc = direction === 'horizontal' ? 1 : 0;

  // Check bounds
  const endRow = startRow + dr * (word.length - 1);
  const endCol = startCol + dc * (word.length - 1);
  if (endRow > 14 || endCol > 14) return null;

  // Check that the word doesn't extend an existing word (cells before/after must be empty)
  const beforeR = startRow - dr, beforeC = startCol - dc;
  const afterR = endRow + dr, afterC = endCol + dc;
  if (beforeR >= 0 && beforeC >= 0 && board[`${beforeR}-${beforeC}`]) return null;
  if (afterR <= 14 && afterC <= 14 && board[`${afterR}-${afterC}`]) return null;

  let touchesExisting = false;
  let usesTile = false;
  const tileCounts = new Map<string, number>();
  for (const t of tiles) tileCounts.set(t, (tileCounts.get(t) || 0) + 1);
  let blanksLeft = blanks;
  let score = 0;
  let wordMultiplier = 1;

  for (let i = 0; i < word.length; i++) {
    const r = startRow + dr * i;
    const c = startCol + dc * i;
    const key = `${r}-${c}`;
    const existing = board[key];
    const ch = word[i];

    if (existing) {
      if (existing.letter.toLowerCase() !== ch) return null; // conflict
      touchesExisting = true;
      score += letterScore(ch); // existing tiles score face value, no multiplier
    } else {
      // Need this letter from our tiles
      const have = tileCounts.get(ch) || 0;
      let isBlank = false;
      if (have > 0) {
        tileCounts.set(ch, have - 1);
      } else if (blanksLeft > 0) {
        blanksLeft--;
        isBlank = true;
      } else {
        return null; // can't form this word here
      }
      usesTile = true;

      // Apply board multipliers for newly placed tiles
      const bonus = BOARD_LAYOUT[r][c];
      let letterMult = 1;
      if (bonus === 'DL') letterMult = 2;
      else if (bonus === 'TL') letterMult = 3;
      else if (bonus === 'DW') wordMultiplier *= 2;
      else if (bonus === 'TW') wordMultiplier *= 3;
      else if (bonus === '★') wordMultiplier *= 2; // center star = double word

      score += isBlank ? 0 : letterScore(ch) * letterMult;

      // Check perpendicular words — for simplicity, require the adjacent cells
      // perpendicular to be empty (avoids invalid cross-words)
      const pr1 = direction === 'horizontal' ? { r: r - 1, c } : { r, c: c - 1 };
      const pr2 = direction === 'horizontal' ? { r: r + 1, c } : { r, c: c + 1 };
      if (pr1.r >= 0 && pr1.c >= 0 && board[`${pr1.r}-${pr1.c}`]) return null;
      if (pr2.r <= 14 && pr2.c <= 14 && board[`${pr2.r}-${pr2.c}`]) return null;
    }
  }

  if (!touchesExisting || !usesTile) return null;

  return {
    move: { word: word.toUpperCase(), startRow, startCol, direction },
    score: score * wordMultiplier,
  };
}

// Standard Scrabble letter values
const LETTER_SCORES: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8,
  k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1,
  u: 1, v: 4, w: 4, x: 8, y: 4, z: 10,
};

function letterScore(ch: string): number {
  return LETTER_SCORES[ch.toLowerCase()] || 0;
}
