import { getDocument, mutateDocumentAtomically, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { getLevelForExperience, WIN_BONUS_BERRIES, WIN_BONUS_EXPERIENCE } from '@/lib/tile-cosmetics';
import { normalizePlayerStats } from '@/lib/player-stats';
import { applyArcadeSession, claimDailyReward, normalizeRetentionState } from '@/lib/retention';

export async function awardPlayerProgress(userId: string, rewards: { berries?: number; experience?: number }) {
  if (!userId) return null;

  const profile = normalizeUserCosmetics(await getDocument<any>('users', userId));
  const berries = (profile.berries || 0) + (rewards.berries || 0);
  const experience = (profile.experience || 0) + (rewards.experience || 0);
  const level = getLevelForExperience(experience);

  return updateDocument('users', userId, {
    berries,
    experience,
    level,
    updatedAt: new Date().toISOString(),
  });
}

export async function recordScoreProgress(
  userId: string,
  rewards: { turnScore: number; wordsPlayed: number; gameScore: number }
) {
  if (!userId) return null;

  const profile = await getDocument<any>('users', userId);
  const stats = normalizePlayerStats(profile?.stats);
  const nextStats = {
    ...stats,
    totalScore: stats.totalScore + rewards.turnScore,
    highestSingleTurnScore: Math.max(stats.highestSingleTurnScore, rewards.turnScore),
    highestGameScore: Math.max(stats.highestGameScore, rewards.gameScore),
    bestWordScore: Math.max(stats.bestWordScore, rewards.turnScore),
    totalWordsPlayed: stats.totalWordsPlayed + rewards.wordsPlayed,
  };

  return updateDocument('users', userId, {
    totalScore: nextStats.totalScore,
    stats: nextStats,
    updatedAt: new Date().toISOString(),
  });
}

export async function recordCompletedGame(
  game: { id: string; players: string[]; playerData: Record<string, { score: number }>; winner?: string }
) {
  await Promise.all(
    game.players.map(async (playerId) => {
      const requestId = `word-duel:${game.id}:${playerId}`;
      await mutateDocumentAtomically('users', playerId, (document) => {
        const profile = normalizeUserCosmetics(document as any) as any;
        const stats = normalizePlayerStats(document.stats);
        const didWin = game.winner === playerId;
        const didTie = game.winner === 'draw';
        const score = game.playerData[playerId]?.score || 0;
        const retentionResult = applyArcadeSession(normalizeRetentionState(document.retention), 'word-duel', {
          sessionId: requestId,
          outcome: didWin ? 'won' : didTie ? 'completed' : 'lost',
          score,
        });
        const daily = claimDailyReward(retentionResult.retention);
        const rewardBerries = retentionResult.rewardBerries + daily.rewardBerries;
        const rewardExperience = retentionResult.rewardExperience + daily.rewardExperience;
        const nextExperience = profile.experience + rewardExperience;
        const nextStats = {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          wins: stats.wins + (didWin ? 1 : 0),
          losses: stats.losses + (!didWin && !didTie ? 1 : 0),
          ties: stats.ties + (didTie ? 1 : 0),
          highestGameScore: Math.max(stats.highestGameScore, score),
        };
        return {
          patch: {
            stats: nextStats,
            retention: daily.retention,
            berries: profile.berries + rewardBerries,
            experience: nextExperience,
            level: getLevelForExperience(nextExperience),
            updatedAt: new Date().toISOString(),
          },
          result: { rewards: { berries: rewardBerries, experience: rewardExperience } },
          ledger: { requestId, kind: 'word-duel-completion', currency: 'berries', amount: rewardBerries, balanceAfter: profile.berries + rewardBerries, metadata: { gameId: game.id } },
        };
      }, { requestId });
    })
  );
}

export async function awardWinnerBonusIfNeeded(winner: string | undefined, alreadyFinished?: boolean, gameId?: string) {
  if (!winner || winner === 'draw' || alreadyFinished) {
    return 0;
  }

  if (gameId) {
    const requestId = `word-duel-winner:${gameId}:${winner}`;
    await mutateDocumentAtomically('users', winner, (document) => {
      const profile = normalizeUserCosmetics(document as any) as any;
      const nextExperience = profile.experience + WIN_BONUS_EXPERIENCE;
      return {
        patch: { berries: profile.berries + WIN_BONUS_BERRIES, experience: nextExperience, level: getLevelForExperience(nextExperience), updatedAt: new Date().toISOString() },
        result: { berries: WIN_BONUS_BERRIES, experience: WIN_BONUS_EXPERIENCE },
        ledger: { requestId, kind: 'word-duel-winner', currency: 'berries', amount: WIN_BONUS_BERRIES, balanceAfter: profile.berries + WIN_BONUS_BERRIES, metadata: { gameId } },
      };
    }, { requestId });
  } else {
    await awardPlayerProgress(winner, { berries: WIN_BONUS_BERRIES, experience: WIN_BONUS_EXPERIENCE });
  }
  return WIN_BONUS_BERRIES;
}
