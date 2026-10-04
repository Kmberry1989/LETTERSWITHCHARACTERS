import { describe, expect, it } from 'vitest';
import { authSessionSchema, clawRequestSchema, retentionProgressSchema } from '@/lib/server/request-schemas';

describe('API request contracts', () => {
  it('accepts legacy crane clients while supporting idempotency keys', () => {
    expect(clawRequestSchema.safeParse({ action: 'purchase-token' }).success).toBe(true);
    expect(clawRequestSchema.safeParse({ action: 'purchase-token', requestId: crypto.randomUUID() }).success).toBe(true);
  });

  it('accepts bounded auth input and rejects oversized credentials', () => {
    expect(authSessionSchema.safeParse({ mode: 'email', username: 'player_1', password: 'password123' }).success).toBe(true);
    expect(authSessionSchema.safeParse({ mode: 'email', username: 'player_1', password: 'x'.repeat(257) }).success).toBe(false);
  });

  it('requires a valid retention mode for arcade sessions', () => {
    expect(retentionProgressSchema.safeParse({ action: 'arcade-session', sessionId: 's1', modeId: 'word-search' }).success).toBe(true);
    expect(retentionProgressSchema.safeParse({ action: 'arcade-session', sessionId: 's1', modeId: 'admin' }).success).toBe(false);
    expect(retentionProgressSchema.safeParse({ action: 'arcade-session', sessionId: 's1', modeId: 'five-in-six', outcome: 'lost' }).success).toBe(true);
    expect(retentionProgressSchema.safeParse({ action: 'arcade-session', sessionId: 's1', modeId: 'five-in-six', outcome: 'reset-and-pay-me' }).success).toBe(false);
  });
});
