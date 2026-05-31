import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { getLevelForExperience, WIN_BONUS_BERRIES, WIN_BONUS_EXPERIENCE } from '@/lib/tile-cosmetics';
import { normalizePlayerStats } from '@/lib/player-stats';

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
  game: { players: string[]; playerData: Record<string, { score: number }>; winner?: string }
) {
  await Promise.all(
    game.players.map(async (playerId) => {
      const profile = await getDocument<any>('users', playerId);
      const stats = normalizePlayerStats(profile?.stats);
      const didWin = game.winner === playerId;
      const didTie = game.winner === 'draw';
      const nextStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        wins: stats.wins + (didWin ? 1 : 0),
        losses: stats.losses + (!didWin && !didTie ? 1 : 0),
        ties: stats.ties + (didTie ? 1 : 0),
        highestGameScore: Math.max(stats.highestGameScore, game.playerData[playerId]?.score || 0),
      };

      await updateDocument('users', playerId, {
        stats: nextStats,
        updatedAt: new Date().toISOString(),
      });
    })
  );
}

export async function awardWinnerBonusIfNeeded(winner: string | undefined, alreadyFinished?: boolean) {
  if (!winner || winner === 'draw' || alreadyFinished) {
    return 0;
  }

  await awardPlayerProgress(winner, {
    berries: WIN_BONUS_BERRIES,
    experience: WIN_BONUS_EXPERIENCE,
  });
  return WIN_BONUS_BERRIES;
}
