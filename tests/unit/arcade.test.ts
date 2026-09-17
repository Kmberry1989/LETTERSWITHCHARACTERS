import { describe, expect, it } from 'vitest';
import { validatePlayableWord } from '@/lib/server/word-validator';
import { RETENTION_MODES, getDailyChallenge, normalizeRetentionState, applyArcadeSession } from '@/lib/retention';

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

  it('records a loss as participation without granting clear or daily completion', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    const result = applyArcadeSession(null, 'five-in-six', { sessionId: 'loss-1', outcome: 'lost', score: 60, now });
    expect(result.retention.modeProgress['five-in-six'].sessionsPlayed).toBe(1);
    expect(result.retention.dailyChallengeCompletions).toEqual([]);
    expect(result.rewardBerries).toBe(8);
  });

  it('does not record or reward an abandoned run', () => {
    const result = applyArcadeSession(null, 'word-search', { sessionId: 'abandoned-1', outcome: 'abandoned', score: 999 });
    expect(result.retention.modeProgress['word-search'].sessionsPlayed).toBe(0);
    expect(result.retention.recentSessionIds).toEqual([]);
    expect(result.rewardBerries).toBe(0);
    expect(result.rewardExperience).toBe(0);
  });

  it('rotates daily challenges across every maintained mode', () => {
    const seen = new Set(Array.from({ length: 18 }, (_, day) => getDailyChallenge(new Date(Date.UTC(2026, 0, day + 1))).modeId));
    expect([...RETENTION_MODES].every((modeId) => seen.has(modeId))).toBe(true);
  });
});
