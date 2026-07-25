import { NextResponse } from 'next/server';
import {
  CLAW_CREDIT_COST,
  CLAW_PRIZE_BY_ID,
  CLAW_PRIZE_CATALOG,
  type ClawPlay,
  makeClawCollection,
  nextClawCabinetSeed,
  normalizeClawProfile,
  selectClawStock,
} from '@/lib/claw-crane';
import { claimDailyReward, applyArcadeSession } from '@/lib/retention';
import { getLevelForExperience } from '@/lib/tile-cosmetics';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { getCurrentUser } from '@/lib/server/auth';
import {
  getDocument,
  mutateDocumentAtomically,
  toDocumentStoreError,
  type JsonRecord,
} from '@/lib/server/document-store';

export const dynamic = 'force-dynamic';

class ClawRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ClawRequestError';
  }
}

function clampPosition(value: unknown) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(-3.25, Math.min(3.25, number));
}

function makeState(profile: JsonRecord) {
  const cosmetics = normalizeUserCosmetics(profile as any);
  const claw = normalizeClawProfile(profile as any);
  const collection = makeClawCollection(profile as any);
  const stockedPrizeIds =
    claw.activeClawPlay?.stockPrizeIds?.filter((id) => Boolean(CLAW_PRIZE_BY_ID[id])) ||
    selectClawStock(collection.ownedPrizeIds, claw.clawCabinetSeed);

  return {
    berries: cosmetics.berries,
    credits: claw.clawCredits,
    collection,
    stats: claw.clawStats,
    stockedPrizeIds,
    activePlay: claw.activeClawPlay,
    creditCost: CLAW_CREDIT_COST,
  };
}

function responseError(error: unknown) {
  if (error instanceof ClawRequestError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const normalized = toDocumentStoreError(error, 'The prize crane could not reach player storage.');
  const status =
    'status' in normalized && typeof normalized.status === 'number'
      ? normalized.status
      : normalized.message.includes('does not exist')
        ? 404
        : 500;
  return NextResponse.json({ error: normalized.message }, { status });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const profile = await getDocument<JsonRecord>('users', user.uid);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }
    return NextResponse.json({ state: makeState(profile) });
  } catch (error) {
    return responseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const action = String(body?.action || '');
    if (!action) {
      throw new ClawRequestError('Missing action.', 400);
    }

    if (action === 'purchase-credit') {
      const mutation = await mutateDocumentAtomically('users', user.uid, (profile) => {
        const cosmetics = normalizeUserCosmetics(profile as any);
        const claw = normalizeClawProfile(profile as any);
        const collection = makeClawCollection(profile as any);
        if (collection.complete) {
          throw new ClawRequestError('Your prize collection is already complete.', 409);
        }
        if (cosmetics.berries < CLAW_CREDIT_COST) {
          throw new ClawRequestError('Not enough berries for a crane credit.', 400);
        }
        return {
          patch: {
            berries: cosmetics.berries - CLAW_CREDIT_COST,
            clawCredits: claw.clawCredits + 1,
            updatedAt: new Date().toISOString(),
          },
          result: { purchased: true },
        };
      });
      return NextResponse.json({ ...mutation.result, state: makeState(mutation.document) });
    }

    if (action === 'start-play') {
      const mutation = await mutateDocumentAtomically('users', user.uid, (profile) => {
        const claw = normalizeClawProfile(profile as any);
        if (claw.activeClawPlay) {
          return {
            patch: {},
            result: { resumed: true, play: claw.activeClawPlay },
          };
        }
        const collection = makeClawCollection(profile as any);
        if (collection.complete) {
          throw new ClawRequestError('Your prize collection is already complete.', 409);
        }
        if (claw.clawCredits <= 0) {
          throw new ClawRequestError('Insert a crane credit before dropping.', 400);
        }
        const stockPrizeIds = selectClawStock(collection.ownedPrizeIds, claw.clawCabinetSeed);
        if (stockPrizeIds.length === 0) {
          throw new ClawRequestError('There are no unowned prizes left to stock.', 409);
        }
        const play: ClawPlay = {
          id: crypto.randomUUID(),
          seed: claw.clawCabinetSeed,
          stockPrizeIds,
          clawX: clampPosition(body?.clawX),
          clawZ: clampPosition(body?.clawZ),
          status: 'active',
          startedAt: new Date().toISOString(),
        };
        return {
          patch: {
            clawCredits: claw.clawCredits - 1,
            activeClawPlay: play,
            updatedAt: new Date().toISOString(),
          },
          result: { resumed: false, play },
        };
      });
      return NextResponse.json({ ...mutation.result, state: makeState(mutation.document) });
    }

    if (action === 'settle-play') {
      const playId = String(body?.playId || '');
      if (!playId) {
        throw new ClawRequestError('Missing playId.', 400);
      }
      const requestedPrizeId =
        typeof body?.prizeId === 'string' && body.prizeId ? String(body.prizeId) : null;
      const score = Math.max(0, Math.min(10_000, Math.floor(Number(body?.score) || 0)));
      const mutation = await mutateDocumentAtomically('users', user.uid, (profile) => {
        const cosmetics = normalizeUserCosmetics(profile as any);
        const claw = normalizeClawProfile(profile as any);
        if (claw.recentClawPlayIds.includes(playId)) {
          return {
            patch: {},
            result: {
              duplicate: true,
              wonPrizeId: null,
              rewards: { berries: 0, experience: 0 },
            },
          };
        }
        const play = claw.activeClawPlay;
        if (!play || play.id !== playId) {
          throw new ClawRequestError('This crane play is no longer active.', 409);
        }
        if (requestedPrizeId && !play.stockPrizeIds.includes(requestedPrizeId)) {
          throw new ClawRequestError('That prize was not stocked for this play.', 400);
        }
        if (requestedPrizeId && claw.ownedClawPrizeIds.includes(requestedPrizeId)) {
          throw new ClawRequestError('That prize is already in your collection.', 409);
        }

        const now = new Date();
        const wonPrizeId = requestedPrizeId && CLAW_PRIZE_BY_ID[requestedPrizeId] ? requestedPrizeId : null;
        const ownedClawPrizeIds = wonPrizeId
          ? [...claw.ownedClawPrizeIds, wonPrizeId]
          : claw.ownedClawPrizeIds;
        const collectionComplete = ownedClawPrizeIds.length >= CLAW_PRIZE_CATALOG.length;
        const session = applyArcadeSession(profile.retention, 'claw-crane', {
          sessionId: play.id,
          score,
          completed: Boolean(wonPrizeId),
          now,
        });
        const daily = claimDailyReward(session.retention, now);
        const rewardBerries = session.rewardBerries + daily.rewardBerries;
        const rewardExperience = session.rewardExperience + daily.rewardExperience;
        const nextExperience = cosmetics.experience + rewardExperience;

        return {
          patch: {
            berries: cosmetics.berries + rewardBerries,
            experience: nextExperience,
            level: getLevelForExperience(nextExperience),
            retention: daily.retention,
            ownedClawPrizeIds,
            clawPrizeWonAt: wonPrizeId
              ? { ...claw.clawPrizeWonAt, [wonPrizeId]: now.toISOString() }
              : claw.clawPrizeWonAt,
            clawStats: {
              plays: claw.clawStats.plays + 1,
              wins: claw.clawStats.wins + Number(Boolean(wonPrizeId)),
              misses: claw.clawStats.misses + Number(!wonPrizeId),
              collectionCompletedAt: collectionComplete
                ? claw.clawStats.collectionCompletedAt || now.toISOString()
                : claw.clawStats.collectionCompletedAt,
            },
            activeClawPlay: null,
            recentClawPlayIds: [...claw.recentClawPlayIds, play.id].slice(-20),
            clawCabinetSeed: nextClawCabinetSeed(claw.clawCabinetSeed),
            updatedAt: now.toISOString(),
          },
          result: {
            duplicate: false,
            wonPrizeId,
            rewards: {
              berries: rewardBerries,
              experience: rewardExperience,
            },
          },
        };
      });
      return NextResponse.json({ ...mutation.result, state: makeState(mutation.document) });
    }

    throw new ClawRequestError('Unknown action.', 400);
  } catch (error) {
    return responseError(error);
  }
}
