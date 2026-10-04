import { getCurrentUser } from '@/lib/server/auth';
import { mutateDocumentAtomically } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { getLevelForExperience } from '@/lib/tile-cosmetics';
import {
  applyArcadeSession,
  claimDailyReward,
  getNextActionHref,
  normalizeRetentionState,
} from '@/lib/retention';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { retentionProgressSchema } from '@/lib/server/request-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'retention-progress', 60, 60_000);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const body = await parseJson(request, retentionProgressSchema);
    const requestId = body.action === 'arcade-session'
      ? body.sessionId
      : body.requestId || crypto.randomUUID();

    const mutation = await mutateDocumentAtomically<any>('users', user.uid, (document) => {
      const profile = normalizeUserCosmetics(document as any) as any;
      const retention = normalizeRetentionState(profile.retention);

      if (body.action === 'claim-daily-reward') {
        const daily = claimDailyReward(retention);
        const nextExperience = profile.experience + daily.rewardExperience;
        return {
          patch: daily.claimed
            ? {
                retention: daily.retention,
                berries: profile.berries + daily.rewardBerries,
                experience: nextExperience,
                level: getLevelForExperience(nextExperience),
                updatedAt: new Date().toISOString(),
              }
            : {},
          result: {
            claimed: daily.claimed,
            retention: daily.retention,
            rewards: { berries: daily.rewardBerries, experience: daily.rewardExperience },
          },
          ...(daily.claimed ? {
            ledger: {
              requestId,
              kind: 'daily-reward',
              currency: 'berries',
              amount: daily.rewardBerries,
              balanceAfter: profile.berries + daily.rewardBerries,
              metadata: { source: 'retention' },
            },
          } : {}),
        };
      }

      const previousProgress = retention.modeProgress[body.modeId];
      const previousQuests = new Map(retention.quests.map((quest) => [quest.id, quest.progress]));
      const result = applyArcadeSession(retention, body.modeId, {
        sessionId: body.sessionId,
        score: body.score,
        outcome: body.outcome,
        completed: body.completed,
        completeDailyChallenge: body.completeDailyChallenge,
      });
      const currentProgress = result.retention.modeProgress[body.modeId];
      const questDeltas = result.retention.quests
        .map((quest) => ({
          id: quest.id,
          title: quest.title,
          progress: quest.progress,
          goal: quest.goal,
          delta: Math.max(0, quest.progress - (previousQuests.get(quest.id) || 0)),
        }))
        .filter((quest) => quest.delta > 0);
      const progressSummary = {
        outcome: body.outcome || (body.completed ? 'completed' : 'abandoned'),
        bestScore: currentProgress.bestScore,
        isPersonalBest: (body.score || 0) > previousProgress.bestScore,
        questDeltas,
        recommendedNextHref: getNextActionHref(result.retention, false),
      };
      const sessionRewards = { berries: result.rewardBerries, experience: result.rewardExperience };
      if (result.duplicate) {
        return {
          patch: {},
          result: {
            duplicate: true,
            dailyRewardClaimed: false,
            retention: result.retention,
            rewards: { session: sessionRewards, dailyReward: { berries: 0, experience: 0 }, total: sessionRewards },
            progress: progressSummary,
          },
        };
      }
      const daily = claimDailyReward(result.retention);
      const totalRewards = {
        berries: sessionRewards.berries + daily.rewardBerries,
        experience: sessionRewards.experience + daily.rewardExperience,
      };
      const nextExperience = profile.experience + totalRewards.experience;
      return {
        patch: {
          retention: daily.retention,
          berries: profile.berries + totalRewards.berries,
          experience: nextExperience,
          level: getLevelForExperience(nextExperience),
          updatedAt: new Date().toISOString(),
        },
        result: {
          duplicate: false,
          dailyRewardClaimed: daily.claimed,
          retention: daily.retention,
          rewards: {
            session: sessionRewards,
            dailyReward: { berries: daily.rewardBerries, experience: daily.rewardExperience },
            total: totalRewards,
          },
          progress: progressSummary,
        },
        ledger: {
          requestId,
          kind: 'arcade-session-reward',
          currency: 'berries',
          amount: totalRewards.berries,
          balanceAfter: profile.berries + totalRewards.berries,
          metadata: { modeId: body.modeId, sessionId: body.sessionId },
        },
      };
    }, { requestId });
    return jsonOk(mutation.result, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not save arcade progress.'), request);
  }
}
