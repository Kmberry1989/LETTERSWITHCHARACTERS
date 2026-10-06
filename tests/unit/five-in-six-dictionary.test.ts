import { describe, expect, it } from 'vitest';
import { FIVE_IN_SIX_GUESSES, FIVE_IN_SIX_GUESS_SET } from '@/lib/arcade/five-in-six-guesses';
import { FIVE_IN_SIX_WORDS } from '@/lib/arcade/five-in-six-words';

describe('5 in 6 dictionary', () => {
  it('accepts the full Wordle-style guess list without expanding the answer pool', () => {
    expect(FIVE_IN_SIX_GUESSES).toHaveLength(12_972);
    expect(FIVE_IN_SIX_GUESS_SET.has('aahed')).toBe(true);
    expect(FIVE_IN_SIX_WORDS.includes('aahed')).toBe(false);
  });

  it('contains every curated answer', () => {
    expect(FIVE_IN_SIX_WORDS.every((word) => FIVE_IN_SIX_GUESS_SET.has(word))).toBe(true);
  });
});
