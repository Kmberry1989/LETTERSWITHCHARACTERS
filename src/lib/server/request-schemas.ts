import { z } from 'zod';
import { RETENTION_MODES } from '@/lib/retention';

const safeText = (max: number) => z.string().trim().min(1).max(max);

export const authSessionSchema = z.object({
  mode: z.enum(['email', 'guest', 'google', 'apple']).default('email'),
  action: z.enum(['signin', 'signup']).default('signin'),
  username: z.string().trim().max(24).optional(),
  password: z.string().max(256).optional(),
  displayName: z.string().trim().max(80).optional(),
});

export const clawRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('purchase-token'), requestId: z.string().uuid().optional() }),
  z.object({ action: z.literal('purchase-credit'), requestId: z.string().uuid().optional() }),
  z.object({
    action: z.literal('start-play'),
    requestId: z.string().uuid().optional(),
    clawX: z.number().finite().optional(),
    clawZ: z.number().finite().optional(),
  }),
  z.object({
    action: z.literal('settle-play'),
    requestId: z.string().uuid().optional(),
    playId: safeText(128),
    prizeId: z.string().trim().max(80).nullable().optional(),
    score: z.number().finite().optional(),
  }),
]);

export const shopItemSchema = z.object({ itemId: safeText(100), requestId: z.string().uuid().optional() });

export const retentionProgressSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('claim-daily-reward'), requestId: z.string().uuid().optional() }),
  z.object({
    action: z.literal('arcade-session'),
    sessionId: safeText(160),
    modeId: z.enum(RETENTION_MODES),
    score: z.number().finite().optional(),
    outcome: z.enum(['won', 'lost', 'completed', 'abandoned']).optional(),
    completed: z.boolean().optional(),
    completeDailyChallenge: z.boolean().optional(),
  }),
]);

export const validateWordSchema = z.object({ word: safeText(40) });
