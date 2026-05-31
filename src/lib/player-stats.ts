export type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  totalScore: number;
  highestGameScore: number;
  bestWordScore: number;
  totalWordsPlayed: number;
  highestSingleTurnScore: number;
};

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  totalScore: 0,
  highestGameScore: 0,
  bestWordScore: 0,
  totalWordsPlayed: 0,
  highestSingleTurnScore: 0,
};

export function normalizePlayerStats(stats?: Partial<PlayerStats> | null): PlayerStats {
  return {
    gamesPlayed: typeof stats?.gamesPlayed === 'number' ? stats.gamesPlayed : 0,
    wins: typeof stats?.wins === 'number' ? stats.wins : 0,
    losses: typeof stats?.losses === 'number' ? stats.losses : 0,
    ties: typeof stats?.ties === 'number' ? stats.ties : 0,
    totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
    highestGameScore: typeof stats?.highestGameScore === 'number' ? stats.highestGameScore : 0,
    bestWordScore: typeof stats?.bestWordScore === 'number' ? stats.bestWordScore : 0,
    totalWordsPlayed: typeof stats?.totalWordsPlayed === 'number' ? stats.totalWordsPlayed : 0,
    highestSingleTurnScore: typeof stats?.highestSingleTurnScore === 'number' ? stats.highestSingleTurnScore : 0,
  };
}

export function getWinRate(stats: PlayerStats) {
  return stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
}
