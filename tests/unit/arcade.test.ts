import { describe, expect, it } from 'vitest';
import { validatePlayableWord } from '@/lib/server/word-validator';
import { getDailyChallenge, normalizeRetentionState, applyArcadeSession } from '@/lib/retention';

describe('arcade rules', () => {
  it('accepts a known playable word and rejects malformed input', () => {
    expect(validatePlayableWord('apple').isValid).toBe(true);
    expect(validatePlayableWord('a').isValid).toBe(false);
    expect(validatePlayableWord('not-a-word-123').isValid).toBe(false);
  });

  it('keeps retention sessions idempotent', () => {
    const initial = normalizeRetentionState(null);
    const first = applyArcadeSession(initial, 'word-search', { sessionId: 'session-1', completed: true, score: 100 });
    const replay = applyArcadeSession(first.retention, 'word-search', { sessionId: 'session-1', completed: true, score: 100 });
    expect(first.duplicate).toBe(false);
    expect(replay.duplicate).toBe(true);
    expect(replay.rewardBerries).toBe(0);
  });

  it('provides a deterministic daily challenge shape', () => {
    const challenge = getDailyChallenge(new Date('2026-08-15T12:00:00Z'));
    expect(challenge.id).toBe('daily-2026-08-15');
    expect(challenge.rewardBerries).toBeGreaterThan(0);
  });
});
